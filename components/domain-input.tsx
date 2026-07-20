"use client";

import { Input } from '@nextui-org/input'
import React from 'react'
import { FileUploader } from './file-uploader';
import { Button } from '@nextui-org/button';
import { checkDomain } from './actions';
import { toast } from "sonner"
import { authClient } from '@/lib/auth-client';
import { DomainDashboard } from './domain-dashboard';
import { getPublicDomainUrl, siteConfig } from '@/config/site';
import { DeployLoading } from './deploy-loading';
import { DeploySuccess } from './deploy-success';
import { motion } from "framer-motion";
import { ApiKeyManager } from "./api-key-manager";

const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
};

type Step = 1 | 2 | 3 | 'success';

export default function DomainName() {
    const { data: session, isPending } = authClient.useSession();
    const isSignedIn = Boolean(session?.user);
    const [step, setStep] = React.useState<Step>(1);
    const [domainValue, setDomainValue] = React.useState('')
    const [isInvalid, setIsInvalid] = React.useState(false);
    const [invalidMessage, setInvalidMessage] = React.useState<string | undefined>(undefined);
    const [fileValue, setFileValue] = React.useState<File[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [refreshKey, setRefreshKey] = React.useState(0);
    const [uploadError, setUploadError] = React.useState<string | null>(null);
    const domainInputRef = React.useRef<HTMLInputElement>(null);
    const domainCheckTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const domainCheckSequence = React.useRef(0);

    const debouncedCheckDomain = React.useCallback((value: string) => {
        if (domainCheckTimeout.current) {
            clearTimeout(domainCheckTimeout.current);
        }

        const sequence = domainCheckSequence.current + 1;
        domainCheckSequence.current = sequence;

        domainCheckTimeout.current = setTimeout(async () => {
            const trimmed = value.trim().toLowerCase();
            if (!trimmed) {
                if (domainCheckSequence.current === sequence) {
                    setIsInvalid(false);
                    setInvalidMessage(undefined);
                }
                return;
            }

            const isValidFormat = /^[a-z0-9-]{3,30}$/.test(trimmed);
            if (!isValidFormat) {
                if (domainCheckSequence.current === sequence) {
                    setIsInvalid(true);
                    if (trimmed.length < 3) {
                        setInvalidMessage("Too short — minimum 3 characters.");
                    } else if (trimmed.length > 30) {
                        setInvalidMessage("Too long — maximum 30 characters.");
                    } else {
                        setInvalidMessage("Letters, numbers, and hyphens only.");
                    }
                }
                return;
            }

            const isValid = await checkDomain(trimmed);

            if (domainCheckSequence.current === sequence) {
                setIsInvalid(!isValid);
                setInvalidMessage(isValid ? undefined : `That name is taken. Try ${trimmed}-2 or ${trimmed}-dev.`);
            }
        }, 300);
    }, []);

    React.useEffect(() => {
        return () => {
            if (domainCheckTimeout.current) {
                clearTimeout(domainCheckTimeout.current);
            }
        };
    }, []);

    React.useEffect(() => {
        if (step !== 1 || !isSignedIn || isPending) {
            return;
        }

        requestAnimationFrame(() => {
            domainInputRef.current?.focus();
        });
    }, [isPending, isSignedIn, step]);

    const handleValueChange = (newValue: string) => {
        if (!isSignedIn) {
            return;
        }

        // Only allow valid characters while typing
        const sanitized = newValue.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setDomainValue(sanitized);
        setUploadError(null);
        debouncedCheckDomain(sanitized);
    };

    const canProceedFromStep1 = domainValue.length >= 3 && !isInvalid && isSignedIn;
    const isStep1ActionDisabled = isSignedIn
        ? !canProceedFromStep1 || loading || isPending
        : loading || isPending;

    const handleUpload = async () => {
        if (!isSignedIn) {
            await authClient.signIn.social({ provider: "github" });
            return;
        }

        if (step === 1) {
            if (canProceedFromStep1) {
                setStep(2);
            } else {
                toast.error("Please enter a valid, available domain name!");
            }
            return;
        }

        if (step === 2) {
            if (fileValue.length === 0) {
                toast.error("Please select an HTML file first.");
                return;
            }

            setUploadError(null);
            setStep(3);
            setLoading(true);

            try {
                const formData = new FormData();
                formData.set("domain", domainValue.toLowerCase().trim());
                if (fileValue[0]) {
                    formData.set("file", fileValue[0]);
                }

                const response = await fetch("/api/domains", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const payload = await response.json().catch(() => null);
                    throw new Error(payload?.error ?? "Failed to create domain");
                }

                setTimeout(() => {
                    setStep('success');
                    setRefreshKey((value) => value + 1);
                    if (fileValue.length > 0) {
                        setTimeout(() => {
                            openInNewTab(getPublicDomainUrl(domainValue.toLowerCase().trim()));
                        }, 1500);
                    }
                }, 2800);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Something went wrong";
                setUploadError(message);
                setStep(2);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        }
    };

    const resetFlow = () => {
        setDomainValue('');
        setFileValue([]);
        setIsInvalid(false);
        setInvalidMessage(undefined);
        setUploadError(null);
        setStep(1);
    };

    const focusCreateFlow = () => {
        setStep(1);
        window.scrollTo({ top: 0, behavior: "smooth" });
        requestAnimationFrame(() => {
            domainInputRef.current?.focus();
        });
    };

    const goBack = () => {
        if (step === 2) {
            setStep(1);
            setUploadError(null);
        }
    };

    return (
        <div className='w-full'>
            <div className="w-full flex flex-col items-center">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        className="w-full flex flex-col gap-5 items-center"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-full text-center mb-2">
                            <h3 className="mt-1 text-xl font-semibold">
                                What should we call it?
                            </h3>
                            <p className="mt-1 text-sm text-default-500">
                                Pick a subdomain for your site.
                            </p>
                        </div>

                        <Input
                            ref={domainInputRef}
                            label="Subdomain"
                            labelPlacement='outside'
                            placeholder="my-awesome-site"
                            startContent={
                                <span className="text-default-400 text-sm">https://</span>
                            }
                            endContent={
                                <span className="text-default-400 text-sm whitespace-nowrap">.{siteConfig.publicHost}</span>
                            }
                            variant='faded'
                            value={domainValue}
                            onValueChange={handleValueChange}
                            errorMessage={isInvalid && invalidMessage}
                            isInvalid={isInvalid}
                            color={domainValue && !isInvalid ? 'success' : 'default'}
                            isDisabled={!isSignedIn || isPending}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    void handleUpload();
                                }
                            }}
                            classNames={{
                                input: "font-medium placeholder:text-default-400 placeholder:text-sm placeholder:font-normal",
                            }}
                        />

                        <Button
                            isLoading={loading || isPending}
                            isDisabled={isStep1ActionDisabled}
                            className='w-full max-w-sm'
                            color='secondary'
                            onPress={handleUpload}
                        >
                            {isSignedIn ? "Continue" : "Sign in with GitHub to continue"}
                        </Button>

                        {!isSignedIn && !isPending && (
                            <p className="text-xs text-default-500">
                                Signing in lets you claim a subdomain and upload your HTML.
                            </p>
                        )}
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        className="w-full flex flex-col gap-5 items-center"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-full text-center mb-2">
                            <h3 className="mt-1 text-xl font-semibold">
                                Upload your HTML file
                            </h3>
                            <p className="mt-1 text-sm text-default-500">
                                For: <span className="font-medium text-foreground">https://{domainValue}.{siteConfig.publicHost}</span>
                            </p>
                        </div>

                        <div className="w-full">
                            <FileUploader
                                value={fileValue}
                                onValueChange={setFileValue}
                                maxSize={16 * 1024 * 1024}
                                maxFiles={1}
                                disabled={!isSignedIn || isPending}
                                disabledLabel={isSignedIn ? "HTML selected" : "Sign in to upload HTML"}
                                inlineError={uploadError}
                                autoFocus
                            />
                        </div>

                        <div className="flex w-full max-w-sm gap-3">
                            <Button
                                variant="flat"
                                className="flex-1"
                                onPress={goBack}
                                isDisabled={loading}
                            >
                                ← Back
                            </Button>
                            <Button
                                isLoading={loading}
                                isDisabled={loading || fileValue.length === 0}
                                className='flex-1'
                                color='secondary'
                                onPress={handleUpload}
                            >
                                Deploy
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        className="w-full flex flex-col items-center"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <DeployLoading domain={`${domainValue}.${siteConfig.publicHost}`} />
                    </motion.div>
                )}

                {step === 'success' && (
                    <motion.div
                        key="success"
                        className="w-full flex flex-col items-center"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <DeploySuccess
                            domain={domainValue}
                            onDeployAnother={resetFlow}
                        />
                    </motion.div>
                )}
            </div>

            <DomainDashboard refreshKey={refreshKey} onCreateSite={focusCreateFlow} />
            <ApiKeyManager />
        </div>
    )
}
