import React from "react";
import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminCoupons() {
  return (
    <ResourceManager
      title="Coupon" endpoint="coupons" testid="admin-coupons"
      defaultItem={{ code: "", type: "percent", value: 10, min_order: 0, active: true }}
      columns={[
        { name: "code", label: "Code" },
        { name: "type", label: "Type" },
        { name: "value", label: "Value" },
        { name: "min_order", label: "Min Order" },
        { name: "active", label: "Active", type: "boolean" },
      ]}
      fields={[
        { name: "code", label: "Coupon Code", type: "text" },
        { name: "type", label: "Type", type: "select", options: ["percent", "flat"] },
        { name: "value", label: "Value", type: "number" },
        { name: "min_order", label: "Minimum Order (₹)", type: "number" },
        { name: "active", label: "Active", type: "boolean" },
      ]}
    />
  );
}
