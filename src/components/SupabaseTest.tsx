import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { sendProjectInvitation } from "@/lib/email";

const SupabaseTest = () => {
  const { toast } = useToast();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<string | null>(null);
  const [isEmailTesting, setIsEmailTesting] = useState(false);

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      // Check if we're using the real Supabase or the mock
      const isRealSupabase = !!import.meta.env.VITE_SUPABASE_URL;

      if (!isRealSupabase) {
        setTestResult(
          "Using mock Supabase implementation. Environment variables not detected.",
        );
        toast({
          title: "Using Mock Supabase",
          description:
            "The application is using mock data as Supabase environment variables are not detected.",
          variant: "destructive",
        });
        return;
      }

      // Test table name - this should be a table that exists in your Supabase project
      // or one that can be created without issues
      const testTable = "supabase_test";

      // Create a test record with a timestamp to ensure uniqueness
      const timestamp = new Date().toISOString();
      const testData = {
        test_id: `test-${Date.now()}`,
        message: `Test message at ${timestamp}`,
        created_at: timestamp,
      };

      // First, try to create the test table if it doesn't exist
      const { error: createTableError } = await supabase.rpc(
        "create_test_table_if_not_exists",
      );

      if (createTableError) {
        // If the RPC function doesn't exist, we'll try to insert anyway
        console.warn("Could not create test table via RPC:", createTableError);
      }

      // Insert test data
      const { data: insertData, error: insertError } = await supabase
        .from(testTable)
        .insert([testData])
        .select();

      console.log("Insert result:", { insertData, insertError });

      if (insertError) {
        throw new Error(`Insert error: ${insertError.message}`);
      }

      // Fetch the data we just inserted to verify it's there
      const { data: fetchData, error: fetchError } = await supabase
        .from(testTable)
        .select("*")
        .eq("test_id", testData.test_id);

      console.log("Fetch result:", { fetchData, fetchError });

      if (fetchError) {
        throw new Error(`Fetch error: ${fetchError.message}`);
      }

      if (fetchData && fetchData.length > 0) {
        setTestResult(
          `Success! Data was stored and retrieved from Supabase. Record ID: ${testData.test_id}`,
        );
        toast({
          title: "Supabase Connection Successful",
          description:
            "Test data was successfully stored and retrieved from Supabase.",
        });
      } else {
        console.log("Initial fetch returned no data, retrying...");
        // Try one more time with a longer delay to account for potential replication lag
        setTimeout(async () => {
          try {
            const { data: retryData, error: retryError } = await supabase
              .from(testTable)
              .select("*")
              .eq("test_id", testData.test_id);

            console.log("Retry fetch result:", { retryData, retryError });

            if (retryData && retryData.length > 0) {
              setTestResult(
                `Success! Data was stored and retrieved from Supabase after retry. Record ID: ${testData.test_id}`,
              );
              toast({
                title: "Supabase Connection Successful",
                description:
                  "Test data was successfully stored and retrieved from Supabase after a retry.",
              });
            } else {
              // Check if the table has RLS enabled
              let rlsData = null;
              let rlsError = null;
              try {
                const { data, error } = await supabase.rpc("check_table_rls", {
                  table_name: testTable,
                });
                rlsData = data;
                rlsError = error;
                console.log("RLS check result:", { data, error });

                // Additional debug info
                const { data: tableInfo, error: tableError } = await supabase
                  .from("pg_tables")
                  .select("*")
                  .eq("tablename", testTable);
                console.log("Table info:", { tableInfo, tableError });

                // Check policies directly
                const { data: policies, error: policiesError } = await supabase
                  .from("pg_policies")
                  .select("*")
                  .eq("tablename", testTable);
                console.log("Policies:", { policies, policiesError });
              } catch (error) {
                console.error("Error checking RLS status:", error);
                rlsError = {
                  message:
                    error instanceof Error
                      ? error.message
                      : "RPC function not available",
                };
              }

              const rlsMessage = rlsData
                ? `RLS is ${rlsData.has_rls ? "enabled" : "disabled"} for this table.`
                : "Could not check RLS status.";

              const errorDetails = retryError
                ? retryError.message
                : rlsError
                  ? rlsError.message
                  : "No error details available";

              setTestResult(
                `Data was inserted but could not be retrieved. This might indicate a permissions issue. ${rlsMessage} Error: ${errorDetails}`,
              );
              toast({
                title: "Partial Success",
                description:
                  "Data was inserted but could not be retrieved. Please try again after the RLS policies have been updated.",
                variant: "warning",
              });
            }
          } catch (retryFetchError) {
            console.error("Error during retry fetch:", retryFetchError);
            setTestResult(
              `Error during retry: ${retryFetchError instanceof Error ? retryFetchError.message : "Unknown error"}`,
            );
          }
        }, 2000);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setTestResult(`Error: ${errorMessage}`);
      toast({
        title: "Supabase Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Supabase test error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const testEmailSending = async () => {
    setIsEmailTesting(true);
    setEmailTestResult(null);

    try {
      // Test parameters for sending an email
      const testEmail = "admin@example.com"; // Using the admin email for testing
      const testProjectId = "test-project-id";
      const testProjectName = "Test Project";
      const testInvitedBy = {
        id: "test-user-id",
        name: "Test User",
        email: "testuser@example.com",
      };
      const testMessage =
        "This is a test invitation sent from the SMTP2GO validation test.";

      const result = await sendProjectInvitation(
        testEmail,
        testProjectId,
        testProjectName,
        testInvitedBy,
        testMessage,
      );

      if (result.success) {
        setEmailTestResult(
          `Success! Email was sent to ${testEmail}. ${result.message}`,
        );
        toast({
          title: "Email Sent Successfully",
          description: `Test email was sent to ${testEmail}`,
        });
      } else {
        throw new Error(result.error || "Unknown error sending email");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setEmailTestResult(`Error: ${errorMessage}`);
      toast({
        title: "Email Sending Failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Email test error:", error);
    } finally {
      setIsEmailTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-900">
        Supabase Connection Test
      </h2>
      <p className="text-gray-600 text-sm">
        Click the button below to test if your application can store and
        retrieve data from Supabase.
      </p>

      <Button
        onClick={testSupabaseConnection}
        disabled={isLoading}
        className="w-full bg-[#0089AD] hover:bg-[#0089AD]/90"
      >
        {isLoading ? "Testing..." : "Test Supabase Connection"}
      </Button>

      {testResult && (
        <div
          className={`mt-4 p-3 rounded-md ${testResult.includes("Success") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {testResult}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">SMTP2GO Email Test</h2>
        <p className="text-gray-600 text-sm mt-2">
          Click the button below to test if your application can send emails
          using SMTP2GO.
        </p>

        <Button
          onClick={testEmailSending}
          disabled={isEmailTesting}
          className="w-full mt-3 bg-[#0089AD] hover:bg-[#0089AD]/90"
        >
          {isEmailTesting ? "Sending..." : "Test Email Sending"}
        </Button>

        {emailTestResult && (
          <div
            className={`mt-4 p-3 rounded-md ${emailTestResult.includes("Success") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
          >
            {emailTestResult}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>Environment variables status:</p>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li>
            VITE_SUPABASE_URL:{" "}
            {import.meta.env.VITE_SUPABASE_URL ? "✅ Set" : "❌ Not set"}
          </li>
          <li>
            VITE_SUPABASE_ANON_KEY:{" "}
            {import.meta.env.VITE_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Not set"}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SupabaseTest;
