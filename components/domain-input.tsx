"use client";


import { Input } from '@nextui-org/input'
import React from 'react'
import { FileUploader } from './file-uploader';
import { Button } from '@nextui-org/button';
import { checkDomain, getSignedURL } from './actions';
var debounce = require('lodash.debounce');
import { toast } from "sonner"
import { redis } from '@/lib/redis';

const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
};

export default function DomainName() {
    const [domainValue, setDomainValue] = React.useState('')
    const [isInvalid, setIsInvalid] = React.useState(false);
    const [fileValue, setFileValue] = React.useState<File[]>([]);
    const [loading, setLoading] = React.useState(false);

    const debouncedCheckDomain = debounce(async (value: string) => {
        const isValid = await checkDomain(value.trim());
        setIsInvalid(!isValid);
    }, 100)

    const handleValueChange = (newValue: string) => {
        setDomainValue(newValue);
        debouncedCheckDomain(newValue);
    };

    const handleUpload = async () => {
        if (domainValue && !isInvalid && fileValue.length > 0) {
            try {
                setLoading(true);
                const uploadPromise = new Promise<void>(async (resolve, reject) => {
                    try {
                        const signedUrl = await getSignedURL(domainValue.trim());
                        const url = signedUrl.success.url;
                        await fetch(url, {
                            method: "PUT",
                            body: fileValue[0],
                            headers: {
                                "Content-Type": "text/html",
                            },
                        });
                        await redis.set(domainValue, 'pritishmishra579@gmail.com');
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
                            setDomainValue('');
                            setFileValue([]);
                            return 'File uploaded successfully!';
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
            toast.error("Please enter a valid domain name and upload a file!");
        }
    };

    return (
        <form className='w-full flex flex-col gap-4 items-center' onSubmit={(e) => { e.preventDefault(); handleUpload(); }}>
            <Input
                label="Domain Name"
                labelPlacement='outside'
                placeholder="Enter your domain name"
                variant='faded'
                value={domainValue}
                onValueChange={handleValueChange}
                errorMessage={isInvalid && "Domain is already taken!"}
                isInvalid={isInvalid}
                color={domainValue && !isInvalid ? 'success' : 'default'}
            />
            <div className="w-full">
                <FileUploader
                    value={fileValue}
                    onValueChange={setFileValue}
                    maxSize={16 * 1024 * 1024}
                    maxFiles={1}
                />
            </div>
            <Button isLoading={loading} className='w-full max-w-sm' color='secondary' type='submit'>HOST IT!</Button>
        </form>
    )
}
