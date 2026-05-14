"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@nextui-org/button";

interface DeployLoadingProps {
  domain: string;
}

const steps = [
  { key: "validate", label: "Validating subdomain" },
  { key: "upload", label: "Uploading to S3" },
  { key: "save", label: "Saving to database" },
  { key: "cache", label: "Purging cache" },
];

export function DeployLoading({ domain }: DeployLoadingProps) {
  const [completed, setCompleted] = React.useState<string[]>([]);
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    steps.forEach((step, index) => {
      const timer = setTimeout(() => {
        setCurrent(index);
        if (index > 0) {
          setCompleted((prev) => [...prev, steps[index - 1].key]);
        }
      }, index * 700);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  const progress = Math.min(
    100,
    Math.round((completed.length / steps.length) * 100)
  );

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 py-8">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-default-500">
          Step 3 of 3
        </p>
        <h3 className="mt-1 text-xl font-semibold">Deploying your site...</h3>
        <p className="mt-1 text-sm text-default-500">
          This usually takes about 5 seconds.
        </p>
      </div>

      <div className="w-full">
        <div className="h-2 w-full overflow-hidden rounded-full bg-default-100">
          <motion.div
            className="h-full rounded-full bg-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-default-400">{progress}%</p>
      </div>

      <div className="w-full space-y-3">
        {steps.map((step, index) => {
          const isDone = completed.includes(step.key);
          const isActive = index === current && !isDone;
          const isPending = index > current;

          return (
            <div
              key={step.key}
              className="flex items-center gap-3 text-sm"
            >
              <div className="flex h-5 w-5 items-center justify-center">
                {isDone ? (
                  <svg
                    className="h-5 w-5 text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : isActive ? (
                  <motion.div
                    className="h-4 w-4 rounded-full border-2 border-secondary border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-default-200" />
                )}
              </div>
              <span
                className={
                  isDone
                    ? "text-success"
                    : isActive
                      ? "text-foreground"
                      : "text-default-400"
                }
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-default-200 bg-default-50/60 px-4 py-3 text-center">
        <p className="text-sm font-medium text-foreground">{domain}</p>
        <p className="text-xs text-default-500">Getting ready to go live</p>
      </div>
    </div>
  );
}
