'use client' 
 
import { useEffect } from 'react'
import { Button } from '@nextui-org/button';

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
 
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-6 py-8 md:py-10">
      <div className="flex max-w-lg flex-col items-center gap-3 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-danger">
          Error
        </p>
        <h2 className="text-2xl font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="text-default-500">
          An unexpected error occurred. You can try again or go back to the home page.
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          variant="flat"
          onPress={() => reset()}
        >
          Try again
        </Button>
      </div>
    </section>
  )
}
