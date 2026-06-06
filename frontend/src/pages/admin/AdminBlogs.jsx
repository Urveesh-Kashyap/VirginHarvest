import React from "react";
import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminBlogs() {
  return (
    <ResourceManager
      title="Blog" endpoint="blogs" testid="admin-blogs"
      defaultItem={{ title: "", excerpt: "", content: "", cover_image: "", author: "Virgin Harvest", published: true, tags: [] }}
      columns={[
        { name: "cover_image", label: "Cover", type: "image" },
        { name: "title", label: "Title" },
        { name: "author", label: "Author" },
        { name: "published", label: "Published", type: "boolean" },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text" },
        { name: "excerpt", label: "Excerpt", type: "textarea", rows: 2 },
        { name: "content", label: "Content", type: "textarea", rows: 8 },
        { name: "cover_image", label: "Cover Image", type: "image" },
        { name: "author", label: "Author", type: "text" },
        { name: "tags", label: "Tags", type: "tags" },
        { name: "published", label: "Published", type: "boolean" },
      ]}
    />
  );
}
