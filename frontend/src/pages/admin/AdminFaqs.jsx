import React from "react";
import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminFaqs() {
  return (
    <ResourceManager
      title="FAQ" endpoint="faqs" testid="admin-faqs"
      defaultItem={{ question: "", answer: "", category: "General", order: 0, active: true }}
      columns={[
        { name: "question", label: "Question" },
        { name: "category", label: "Category" },
        { name: "order", label: "Order" },
        { name: "active", label: "Active", type: "boolean" },
      ]}
      fields={[
        { name: "question", label: "Question", type: "text" },
        { name: "answer", label: "Answer", type: "textarea" },
        { name: "category", label: "Category", type: "text" },
        { name: "order", label: "Order", type: "number" },
        { name: "active", label: "Active", type: "boolean" },
      ]}
    />
  );
}
