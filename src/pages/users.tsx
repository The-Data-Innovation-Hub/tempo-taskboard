import React, { useState, useEffect } from "react";
import {
  Mail,
  UserPlus,
  Check,
  Edit,
  Trash2,
  Plus,
  Building,
  Briefcase,
} from "lucide-react";
import NeumorphicContainer from "../components/common/NeumorphicContainer";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { useAuth, User } from "@/lib/auth";
import { useNavigate, Link } from "react-router-dom";
import { userApi } from "@/lib/api";
import UserFormModal from "@/components/modals/UserFormModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Users = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== "admin") {
      toast({
        title: "Access denied",
        description: "Only administrators can access the user management page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await userApi.getAll();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Failed to load users",
        description: "There was an error loading the user list.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setUserFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserFormOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await userApi.delete(userToDelete.id);
      toast({
        title: "User deleted",
        description: `${userToDelete.name} has been removed successfully.`,
      });
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Failed to delete user",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="users-page p-6 max-w-6xl mx-auto bg-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <Button onClick={handleCreateUser} className="flex items-center">
          <Plus size={16} className="mr-2" />
          Add User
        </Button>
      </div>

      {/* Users grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {users.length > 0 ? (
            users.map((user) => (
              <Link
                to={`/users/${user.id}`}
                key={user.id}
                className="block no-underline text-inherit"
                onClick={(e) => {
                  // Prevent navigation if clicking on action buttons
                  if ((e.target as HTMLElement).closest("button")) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                <NeumorphicContainer
                  className="p-0 overflow-hidden"
                  elevation="medium"
                  interactive
                >
                  <div className="p-4 flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-16 h-16 rounded-full"
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <div className="flex items-center text-gray-600">
                        <Mail size={14} className="mr-1" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                      <div className="flex items-center text-gray-600 mt-1">
                        {user.jobTitle && (
                          <div className="flex items-center mr-3">
                            <Briefcase size={14} className="mr-1" />
                            <span className="text-sm">{user.jobTitle}</span>
                          </div>
                        )}
                        {user.organization?.name && (
                          <div className="flex items-center">
                            <Building size={14} className="mr-1" />
                            <span className="text-sm">
                              {user.organization.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                        </span>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {user.projects && user.projects.length > 0 && (
                    <div className="px-4 pb-3 pt-0">
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        Projects:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {user.projects.map((project) => (
                          <span
                            key={project.id}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                          >
                            {project.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </NeumorphicContainer>
              </Link>
            ))
          ) : (
            <div className="col-span-2 text-center py-12 bg-gray-50 rounded-lg">
              <UserPlus size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No users found
              </h3>
              <p className="text-gray-500 mt-1">
                Get started by adding a new user
              </p>
              <Button onClick={handleCreateUser} className="mt-4">
                Add User
              </Button>
            </div>
          )}
        </div>
      )}

      {/* User Form Modal */}
      <UserFormModal
        open={userFormOpen}
        onOpenChange={setUserFormOpen}
        user={selectedUser}
        onSuccess={fetchUsers}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {userToDelete?.name}'s account and
              remove all their data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
