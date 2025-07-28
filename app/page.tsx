"use client";

import { Navbar } from "@/components/Navbar";
import { Secret } from "@/components/Secret";
import { useState } from "react";

export default function Home() {
  const [isSecretOpen, setSecretOpen] = useState(false);

  return !isSecretOpen ? (
    <Navbar isSecretOpen={isSecretOpen} setSecretOpen={setSecretOpen} />
  ) : (
    <Secret isSecretOpen={isSecretOpen} setSecretOpen={setSecretOpen} />
  );
}
