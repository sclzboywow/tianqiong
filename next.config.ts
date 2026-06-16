import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/admin/ops/content-studio",
        destination: "/ops/content-studio",
        permanent: false,
      },
    ];
  },
};

export default withPayload(nextConfig);
