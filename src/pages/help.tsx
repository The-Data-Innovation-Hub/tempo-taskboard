import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import NeumorphicContainer from "@/components/common/NeumorphicContainer";

const HelpPage = () => {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <NeumorphicContainer className="p-6 mb-6">
        <h1 className="text-3xl font-bold text-[#0089AD] mb-2">Help Center</h1>
        <p className="text-gray-600 mb-6">
          Welcome to the TaskBoard help center. Find answers to common questions
          below.
        </p>
      </NeumorphicContainer>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <NeumorphicContainer className="p-6">
          <h2 className="text-xl font-semibold text-[#0089AD] mb-4">
            Quick Start Guide
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="bg-[#0089AD] text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                1
              </span>
              <span>Create a new project from the dashboard</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#0089AD] text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                2
              </span>
              <span>Add columns to represent your workflow stages</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#0089AD] text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                3
              </span>
              <span>Create tasks and assign them to team members</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#0089AD] text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                4
              </span>
              <span>
                Drag and drop tasks between columns as work progresses
              </span>
            </li>
          </ul>
        </NeumorphicContainer>

        <NeumorphicContainer className="p-6">
          <h2 className="text-xl font-semibold text-[#0089AD] mb-4">
            Contact Support
          </h2>
          <p className="text-gray-700 mb-4">
            Need additional help? Our support team is available to assist you.
          </p>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#0089AD]/10 rounded-full flex items-center justify-center mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-[#0089AD]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-gray-700">support@taskboard.com</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#0089AD]/10 rounded-full flex items-center justify-center mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-[#0089AD]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <span className="text-gray-700">+1 (555) 123-4567</span>
            </div>
          </div>
        </NeumorphicContainer>
      </div>

      <NeumorphicContainer className="p-6">
        <h2 className="text-2xl font-semibold text-[#0089AD] mb-4">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-gray-800 font-medium">
              How do I create a new project?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              To create a new project, navigate to the dashboard and click on
              the "Create Project" button. Fill in the project details in the
              modal that appears and click "Create".
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-gray-800 font-medium">
              How do I invite team members to my project?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Open your project, click on the project settings or team members
              section, and use the "Invite" button to send invitations via email
              to your team members.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-gray-800 font-medium">
              Can I customize my board columns?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Yes, you can customize your board columns by clicking the "Add
              Column" button on your project board. You can also edit or delete
              existing columns by using the column menu (three dots icon).
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-gray-800 font-medium">
              How do I assign tasks to team members?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              When creating or editing a task, you'll find an "Assignees" field
              where you can select team members from a dropdown menu. You can
              assign multiple team members to a single task if needed.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-gray-800 font-medium">
              How do I track task progress?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              Task progress is tracked visually by moving tasks between columns
              on your board. You can also use labels and due dates to further
              categorize and prioritize your tasks.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </NeumorphicContainer>

      <NeumorphicContainer className="p-6 mt-6">
        <h2 className="text-2xl font-semibold text-[#0089AD] mb-4">
          Video Tutorials
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="overflow-hidden">
            <div className="aspect-video bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Tutorial Video 1</span>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-800">
                Getting Started with TaskBoard
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Learn the basics of setting up your first project
              </p>
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="aspect-video bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Tutorial Video 2</span>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-800">
                Advanced Task Management
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Tips and tricks for managing complex projects
              </p>
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="aspect-video bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Tutorial Video 3</span>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-800">
                Team Collaboration Features
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                How to effectively work with your team
              </p>
            </div>
          </Card>
        </div>
      </NeumorphicContainer>
    </div>
  );
};

export default HelpPage;
