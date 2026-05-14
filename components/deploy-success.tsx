"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@nextui-org/button";
import { Link } from "@nextui-org/link";
import { getPublicDomainUrl } from "@/config/site";

interface DeploySuccessProps {
  domain: string;
  onDeployAnother: () => void;
}

export function DeploySuccess({ domain, onDeployAnother }: DeploySuccessProps) {
  const [copied, setCopied] = React.useState(false);
  const url = getPublicDomainUrl(domain);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <motion.div
      className="flex w-full max-w-md flex-col items-center gap-6 py-8 text-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </motion.div>

      <div>
        <h3 className="text-2xl font-semibold">Your site is live!</h3>
        <p className="mt-1 text-default-500">
          Deployed just now · 1 HTML file
        </p>
      </div>

      <div className="w-full rounded-xl border border-default-200 bg-default-50/60 p-5">
        <p className="text-sm font-medium text-default-500">Your URL</p>
        <p className="mt-1 break-all text-lg font-semibold text-foreground">
          {url}
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            variant="flat"
            className="flex-1"
            onPress={copyToClipboard}
          >
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button
            as={Link}
            href={url}
            isExternal
            color="secondary"
            className="flex-1"
          >
            Open site
          </Button>
        </div>
      </div>

      <Button variant="light" onPress={onDeployAnother}>
        Deploy another site
      </Button>
    </motion.div>
  );
}
