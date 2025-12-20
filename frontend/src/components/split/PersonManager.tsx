"use client";

import { useState } from "react";
import type { Person } from "@bill-splitter/shared";

interface PersonManagerProps {
  people: Person[];
  onAddPerson: (
    person: Omit<
      Person,
      "id" | "subtotal" | "taxAmount" | "tipAmount" | "totalOwed"
    >
  ) => void;
  onUpdatePerson: (person: Person) => void;
  onDeletePerson: (personId: string) => void;
}

// Predefined color palette for person identification
const PERSON_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#84CC16",
  "#F43F5E",
  "#06B6D4",
];

export function PersonManager({
  people,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
}: PersonManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newPerson, setNewPerson] = useState({
    name: "",
    email: "",
    color: PERSON_COLORS[0],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedPerson, setEditedPerson] = useState<Person | null>(null);

  const getNextColor = (): string => {
    const usedColors = people.map((p) => p.color);
    const availableColor = PERSON_COLORS.find(
      (color) => !usedColors.includes(color)
    );
    return (
      availableColor || PERSON_COLORS[people.length % PERSON_COLORS.length]
    );
  };

  const handleAddPerson = () => {
    if (!newPerson.name.trim()) return;

    onAddPerson({
      name: newPerson.name.trim(),
      email: newPerson.email.trim() || null,
      color: newPerson.color,
    });

    // Reset form
    setNewPerson({
      name: "",
      email: "",
      color: getNextColor(),
    });
    setIsAdding(false);
  };

  const handleStartEdit = (person: Person) => {
    setEditingId(person.id);
    setEditedPerson({ ...person });
  };

  const handleSaveEdit = () => {
    if (editedPerson && editedPerson.name.trim()) {
      onUpdatePerson({
        ...editedPerson,
        name: editedPerson.name.trim(),
        email: editedPerson.email?.trim() || null,
      });
      setEditingId(null);
      setEditedPerson(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedPerson(null);
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          People ({people.length})
        </h3>
        {!isAdding && (
          <button
            onClick={() => {
              setIsAdding(true);
              setNewPerson((prev) => ({ ...prev, color: getNextColor() }));
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Person
          </button>
        )}
      </div>

      {people.length === 0 && !isAdding && (
        <div className="text-center text-gray-500 py-8">
          <svg
            className="mx-auto w-12 h-12 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-1">
            No people added yet
          </p>
          <p className="text-gray-500">
            Add people who will be splitting this bill
          </p>
        </div>
      )}

      {/* Add person form */}
      {isAdding && (
        <div className="border border-blue-300 rounded-lg p-4 bg-blue-50 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Add New Person</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={newPerson.name}
                onChange={(e) =>
                  setNewPerson((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter person's name"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={newPerson.email}
                onChange={(e) =>
                  setNewPerson((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="person@example.com"
              />
              {newPerson.email && !isValidEmail(newPerson.email) && (
                <p className="text-red-600 text-xs mt-1">
                  Please enter a valid email address
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {PERSON_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewPerson((prev) => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newPerson.color === color
                        ? "border-gray-900 scale-110"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewPerson({
                    name: "",
                    email: "",
                    color: PERSON_COLORS[0],
                  });
                }}
                className="px-3 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPerson}
                disabled={
                  !newPerson.name.trim() ||
                  (!!newPerson.email && !isValidEmail(newPerson.email))
                }
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Add Person
              </button>
            </div>
          </div>
        </div>
      )}

      {/* People list */}
      <div className="space-y-3">
        {people.map((person) => (
          <div
            key={person.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            {editingId === person.id && editedPerson ? (
              // Edit mode
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editedPerson.name}
                    onChange={(e) =>
                      setEditedPerson((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={editedPerson.email || ""}
                    onChange={(e) =>
                      setEditedPerson((prev) =>
                        prev ? { ...prev, email: e.target.value || null } : null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {PERSON_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setEditedPerson((prev) =>
                            prev ? { ...prev, color } : null
                          )
                        }
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          editedPerson.color === color
                            ? "border-gray-900 scale-110"
                            : "border-gray-300 hover:border-gray-500"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              // Display mode
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: person.color }}
                  >
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{person.name}</h4>
                    {person.email && (
                      <p className="text-sm text-gray-500">{person.email}</p>
                    )}
                    <div className="text-sm text-gray-600 mt-1">
                      Owes:{" "}
                      <span className="font-semibold">${person.totalOwed}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(person)}
                    className="px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeletePerson(person.id)}
                    className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
