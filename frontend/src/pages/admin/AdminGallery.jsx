import React from "react";
import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminGallery() {
  return (
    <ResourceManager
      title="Gallery" endpoint="gallery" testid="admin-gallery"
      defaultItem={{ title: "", image: "", caption: "", active: true }}
      columns={[
        { name: "image", label: "Image", type: "image" },
        { name: "title", label: "Title" },
        { name: "caption", label: "Caption" },
        { name: "active", label: "Active", type: "boolean" },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text" },
        { name: "image", label: "Image", type: "image" },
        { name: "caption", label: "Caption", type: "text" },
        { name: "active", label: "Active", type: "boolean" },
      ]}
    />
  );
}
