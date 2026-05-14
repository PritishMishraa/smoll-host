"use client"

import * as React from "react"

import Dropzone, {
    type DropzoneProps,
    type FileRejection,
} from "react-dropzone"
import { toast } from "sonner"

import { cn, formatBytes } from "@/lib/utlis"
import { useControllableState } from "@/hooks/use-controllable-state"
import { UploadIcon } from "./icons"

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: File[]
    onValueChange?: React.Dispatch<React.SetStateAction<File[]>>
    onUpload?: (files: File[]) => Promise<void>
    progresses?: Record<string, number>
    accept?: DropzoneProps["accept"]
    maxSize?: DropzoneProps["maxSize"]
    maxFiles?: DropzoneProps["maxFiles"]
    multiple?: boolean
    disabled?: boolean
    disabledLabel?: string
    inlineError?: string | null
}

export function FileUploader(props: FileUploaderProps) {
    const {
        value: valueProp,
        onValueChange,
        onUpload,
        progresses,
        accept = {
            "text/html": [".html", ".htm"],
        },
        maxSize = 1024 * 1024 * 2,
        maxFiles = 1,
        multiple = false,
        disabled = false,
        disabledLabel = "HTML selected",
        inlineError,
        className,
        ...dropzoneProps
    } = props

    const [files, setFiles] = useControllableState({
        prop: valueProp,
        onChange: onValueChange,
    })

    const onDrop = React.useCallback(
        (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
            if (!multiple && maxFiles === 1 && acceptedFiles.length > 1) {
                toast.error("Cannot upload more than 1 file at a time")
                return
            }

            if ((files?.length ?? 0) + acceptedFiles.length > maxFiles) {
                toast.error(`Cannot upload more than ${maxFiles} files`)
                return
            }

            const newFiles = acceptedFiles.map((file) =>
                Object.assign(file, {
                    preview: URL.createObjectURL(file),
                })
            )

            const updatedFiles = files ? [...files, ...newFiles] : newFiles

            setFiles(updatedFiles)

            if (rejectedFiles.length > 0) {
                rejectedFiles.forEach(({ file, errors }) => {
                    const reason = errors[0]?.code === "file-too-large"
                        ? `File too large (${formatBytes(file.size)}). Max is ${formatBytes(maxSize)}.`
                        : errors[0]?.code === "file-invalid-type"
                            ? "We only accept .html and .htm files."
                            : `File ${file.name} was rejected`
                    toast.error(reason)
                })
            }

            if (
                onUpload &&
                updatedFiles.length > 0 &&
                updatedFiles.length <= maxFiles
            ) {
                const target =
                    updatedFiles.length > 0 ? `${updatedFiles.length} files` : `file`

                toast.promise(onUpload(updatedFiles), {
                    loading: `Uploading ${target}...`,
                    success: () => {
                        setFiles([])
                        return `${target} uploaded`
                    },
                    error: `Failed to upload ${target}`,
                })
            }
        },

        [files, maxFiles, multiple, onUpload, setFiles, maxSize]
    )

    const isDisabled = disabled || (files?.length ?? 0) >= maxFiles
    const selectedFile = files && files.length > 0 ? files[0] : null

    return (
        <div className="relative flex flex-col gap-4 overflow-hidden">
            <Dropzone
                onDrop={onDrop}
                accept={accept}
                maxSize={maxSize}
                maxFiles={maxFiles}
                multiple={maxFiles > 1 || multiple}
                disabled={isDisabled}
            >
                {({ getRootProps, getInputProps, isDragActive }) => (
                    <div
                        {...getRootProps()}
                        className={cn(
                            "group relative grid w-full cursor-pointer place-items-center rounded-xl border-2 border-dashed border-default-300 bg-default-50/40 px-5 py-2.5 text-center transition-colors hover:border-secondary/60 hover:bg-secondary/10",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            isDragActive && "border-secondary bg-secondary/10",
                            isDisabled && "pointer-events-none opacity-60",
                            selectedFile && "border-success bg-success/5",
                            className
                        )}
                        {...dropzoneProps}
                    >
                        <input {...getInputProps()} />
                        {selectedFile ? (
                            <div className="flex flex-col items-center justify-center gap-3 sm:px-5 py-6">
                                <div className="rounded-full border border-dashed border-success/40 p-3">
                                    <svg
                                        className="h-7 w-7 text-success"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-foreground">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-sm text-default-500">
                                        {formatBytes(selectedFile.size)} · Click or drop to replace
                                    </p>
                                </div>
                            </div>
                        ) : isDragActive ? (
                            <div className="flex flex-col items-center justify-center gap-4 sm:px-5 py-10">
                                <div className="rounded-full border border-dashed p-3">
                                    <UploadIcon
                                        className="h-9 w-9 text-secondary transition-transform"
                                        aria-hidden="true"
                                    />
                                </div>
                                <p className="font-medium text-default-600">
                                    {maxFiles > 1 ? "Drop the files here" : "Drop your HTML file here"}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-4 sm:px-5 py-10">
                                <div className="rounded-full border border-dashed p-3">
                                    <UploadIcon
                                        className={cn("h-7 w-7 text-default-500", isDisabled && "text-success")}
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="space-y-px">
                                    {isDisabled ?
                                        <p className="font-medium text-default-600">
                                            {disabledLabel}
                                        </p>
                                        :
                                        <>
                                            <p className="font-medium text-default-600">
                                                {maxFiles > 1
                                                    ? "Drag files here, or click to select files"
                                                    : "Drop your HTML file here, or click to browse"}
                                            </p>
                                            <p className="text-sm text-default-500">
                                                {maxFiles > 1 ? "You can upload" : "Only one .html or .htm file is supported"}
                                                {maxFiles > 1
                                                    ? ` ${maxFiles === Infinity ? "multiple" : maxFiles} files (up to ${formatBytes(maxSize)} each)`
                                                    : `, up to ${formatBytes(maxSize)}`}
                                            </p>
                                        </>
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Dropzone>

            {inlineError && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {inlineError}
                </div>
            )}
        </div>
    )
}
