import React from "react";
import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminTestimonials() {
  return (
    <ResourceManager
      title="Testimonial" endpoint="testimonials" testid="admin-testimonials"
      defaultItem={{ name: "", location: "", quote: "", rating: 5, avatar: "", active: true }}
      columns={[
        { name: "name", label: "Name" },
        { name: "location", label: "Location" },
        { name: "rating", label: "Rating" },
        { name: "active", label: "Active", type: "boolean" },
      ]}
      fields={[
        { name: "name", label: "Name", type: "text" },
        { name: "location", label: "Location", type: "text" },
        { name: "quote", label: "Quote", type: "textarea" },
        { name: "rating", label: "Rating (1-5)", type: "number" },
        { name: "avatar", label: "Avatar", type: "image" },
        { name: "active", label: "Active", type: "boolean" },
      ]}
    />
  );
}
