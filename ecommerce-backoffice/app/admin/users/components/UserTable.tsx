"use client";
import { User } from "../types/user";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2 } from "lucide-react";

interface Props {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

export default function UserTable({ users, onEdit, onDelete }: Props) {
  return (
    <table className="w-full border border-gray-200 rounded">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-4 py-2 text-left">Name</th>
          <th className="border px-4 py-2 text-left">Email</th>
          <th className="border px-4 py-2 text-left">Role</th>
          <th className="border px-4 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-gray-50">
            <td className="border px-4 py-2">{user.name}</td>
            <td className="border px-4 py-2">{user.email}</td>
            <td className="border px-4 py-2">{user.role}</td>
            <td className="border px-4 py-2 text-center flex justify-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => onEdit(user)}>
                <Edit2 size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(user.id)}>
                <Trash2 size={14} className="text-red-500" />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
