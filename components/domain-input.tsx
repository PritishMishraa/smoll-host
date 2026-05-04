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

const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
};

export default function DomainName() {
    const { data: session, isPending } = authClient.useSession();
    const isSignedIn = Boolean(session?.user);
    const [domainValue, setDomainValue] = React.useState('')
    const [isInvalid, setIsInvalid] = React.useState(false);
    const [fileValue, setFileValue] = React.useState<File[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [refreshKey, setRefreshKey] = React.useState(0);
    const domainCheckTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const domainCheckSequence = React.useRef(0);

    const debouncedCheckDomain = React.useCallback((value: string) => {
        if (domainCheckTimeout.current) {
            clearTimeout(domainCheckTimeout.current);
        }

        const sequence = domainCheckSequence.current + 1;
        domainCheckSequence.current = sequence;

        domainCheckTimeout.current = setTimeout(async () => {
            const isValid = await checkDomain(value.trim());

            if (domainCheckSequence.current === sequence) {
                setIsInvalid(!isValid);
            }
        }, 100);
    }, []);

    React.useEffect(() => {
        return () => {
            if (domainCheckTimeout.current) {
                clearTimeout(domainCheckTimeout.current);
            }
        };
    }, []);

    const handleValueChange = (newValue: string) => {
        if (!isSignedIn) {
            return;
        }

        setDomainValue(newValue);
        debouncedCheckDomain(newValue);
    };

    const handleUpload = async () => {
        if (!isSignedIn) {
            await authClient.signIn.social({ provider: "github" });
            return;
        }

        if (domainValue && !isInvalid) {
            try {
                setLoading(true);
                const uploadPromise = new Promise<void>(async (resolve, reject) => {
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

                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });

                toast.promise(
                    uploadPromise,
                    {
                        loading: 'Uploading file...',
                        success: () => {
                            if (fileValue.length > 0) {
                                setTimeout(() => {
                                    openInNewTab(getPublicDomainUrl(domainValue.toLowerCase().trim()));
                                }, 2000);
                            }
                            setDomainValue('');
                            setFileValue([]);
                            setRefreshKey((value) => value + 1);
                            return fileValue.length > 0
                                ? 'Domain created and file uploaded!'
                                : 'Domain created!';
                        },
                        error: (error) => `Error uploading files: ${error.message}`,
                    }
                );
            } catch (error) {
                console.error("Error uploading HTML files:", error);
            } finally {
                setLoading(false);
            }
        } else {
            toast.error("Please enter a valid domain name!");
        }
    };

    return (
        <div className='w-full'>
            <form className='w-full flex flex-col gap-4 items-center' onSubmit={(e) => { e.preventDefault(); handleUpload(); }}>
                {!isSignedIn && !isPending && (
                    <p className="w-full text-sm text-default-500">
                        Sign in to claim a subdomain and upload your HTML.
                    </p>
                )}
                <Input
                    label="Domain Name"
                    labelPlacement='outside'
                    placeholder="Enter your domain name"
                    startContent="https://"
                    endContent={`.${siteConfig.publicHost}`}
                    description="Choose carefully. Subdomains cannot be renamed after creation."
                    variant='faded'
                    value={domainValue}
                    onValueChange={handleValueChange}
                    errorMessage={isInvalid && "Domain is already taken!"}
                    isInvalid={isInvalid}
                    color={domainValue && !isInvalid ? 'success' : 'default'}
                    isDisabled={!isSignedIn || isPending}
                />
                <div className="w-full">
                    <FileUploader
                        value={fileValue}
                        onValueChange={setFileValue}
                        maxSize={16 * 1024 * 1024}
                        maxFiles={1}
                        disabled={!isSignedIn || isPending}
                        disabledLabel={isSignedIn ? "HTML selected" : "Sign in to upload HTML"}
                    />
                </div>
                <Button
                    isLoading={loading || isPending}
                    isDisabled={loading || isPending}
                    className='w-full max-w-sm'
                    color='secondary'
                    type='submit'
                >
                    {isSignedIn ? "Create domain" : "Sign in to create a domain"}
                </Button>
            </form>
            <DomainDashboard refreshKey={refreshKey} />
        </div>
    )
}
