"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        `peer border-input dark:bg-[#394b59] dark:hover:data-[state=unchecked]:bg-[#30404d] bg-[#f5f8fa] hover:data-[state=unchecked]:bg-[#ebf1f5] data-[state=checked]:bg-[rgb(37,99,235)] hover:data-[state=checked]:bg-[rgb(29,78,216)] data-[state=checked]:border-[rgb(37,99,235)] hover:data-[state=checked]:border-[rgb(29,78,216)]
        focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] 
        disabled:cursor-not-allowed cursor-pointer disabled:opacity-50 duration-150`,
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-white transition-none"
      >
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'>
          <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M12 5c-.28 0-.53.11-.71.29L7 9.59l-2.29-2.3a1.003 1.003 0 00-1.42 1.42l3 3c.18.18.43.29.71.29s.53-.11.71-.29l5-5A1.003 1.003 0 0012 5z'
            fill='#fff'
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
