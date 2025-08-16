"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  const [active, setActive] = React.useState(false);
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      onMouseDown={() => {
        setActive(true);
      }}
      onMouseUp={() => {
        setActive(false);
      }}
      onMouseLeave={() => setActive(false)}
      onChange={() => setActive(false)}
      className={cn(
        `peer data-[state=checked]:bg-[#1890ff] dark:data-[state=checked]:bg-[#177ddc] data-[state=unchecked]:bg-[rgba(0,0,0,.25)] dark:data-[state=unchecked]:bg-[rgba(255,255,255,.35)] focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-4 w-[28px] shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`,
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          `bg-white pointer-events-none select-none block w-3 h-3 rounded-full ring-0 transition-all data-[state=unchecked]:translate-x-[1px]
          ${active ? "w-[15px] data-[state=checked]:translate-x-[calc(100%-4.5px)] duration-0" : "data-[state=checked]:translate-x-[calc(100%+1.5px)]"}`
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
