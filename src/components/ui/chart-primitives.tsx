"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: { PRIMARY_COLOR: "hsl(var(--chart-1))", ... } }
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    color?: string
    icon?: React.ComponentType
  }
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ config, children, className, ...props }, ref) => {
  const containerRef = React.useRef<HTMLDivElement>(null)

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={containerRef}
        className={cn(
          "aspect-video [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke]~[stroke]]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-radial-bar-sector]:fill-primary [&_.recharts-sector_[fill]~[fill]]:fill-primary",
          className
        )}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

export type ChartContainerProps = React.ComponentProps<typeof ChartContainer>

const ChartTooltip = RechartsPrimitive.Tooltip

// Tipo manual para o ChartTooltipContent, sem depender dos tipos internos do recharts
type ChartTooltipContentProps = React.ComponentProps<"div"> & {
  active?: boolean
  payload?: any[]
  label?: any
  labelFormatter?: (value: any, payload: any[]) => React.ReactNode
  labelClassName?: string
  formatter?: (value: any, name: any, item: any, index: number, payload: any[]) => React.ReactNode
  color?: string
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || ""}`
      const itemConfig = config[key]
      const value =
        !labelKey && typeof item.payload === "object" && item.payload
          ? item.payload[item.dataKey as keyof typeof item.payload]
          : item.value

      if (labelFormatter) {
        return labelFormatter(value, payload)
      }

      if (itemConfig?.label) {
        return itemConfig.label
      }

      if (!value) {
        return label
      }

      return label
    }, [label, labelFormatter, payload, hideLabel, labelKey, config])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length > 1 && !hideLabel

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border bg-background p-2.5 text-sm shadow-xl",
          className
        )}
      >
        {!nestLabel && !hideLabel ? (
          <div className={cn("font-medium", labelClassName)}>{tooltipLabel}</div>
        ) : null}
        <div className="grid gap-1.5">
          {payload.map((item, i) => {
            const key = `${nameKey || item.name || item.dataKey || ""}`
            const itemConfig = config[key]
            const indicatorColor = color || item.color || itemConfig?.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full items-stretch gap-2 [&>svg]:size-2.5 [&>svg]:text-muted-foreground",
                  hideIndicator && "items-center"
                )}
              >
                {!hideIndicator && (
                  <div
                    className={cn(
                      "shrink-0",
                      {
                        "dot": "flex items-center",
                        "line": "w-1",
                        "dashed": "w-1",
                      }[indicator]
                    )}
                  >
                    {
                      {
                        dot: (
                          <div
                            className="size-2.5 rounded-full"
                            style={{
                              background: indicatorColor,
                            }}
                          />
                        ),
                        line: (
                          <div
                            className="w-full h-full"
                            style={{
                              background: indicatorColor,
                            }}
                          />
                        ),
                        dashed: (
                          <div
                            className="w-full h-full"
                            style={{
                              border: `1px dashed ${indicatorColor}`,
                            }}
                          />
                        ),
                      }[indicator]
                    }
                  </div>
                )}
                <div
                  className={cn(
                    "flex flex-1 justify-between leading-none",
                    nestLabel && "items-center"
                  )}
                >
                  <div className="grid gap-1.5">
                    {nestLabel ? (
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                    ) : null}
                    <span className="font-medium text-foreground">
                      {formatter
                        ? formatter(item.value, item.name, item, i, payload)
                        : item.value}
                    </span>
                  </div>
                  {itemConfig?.icon ? <itemConfig.icon /> : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsPrimitive.Legend

// Tipo manual para o ChartLegendContent, sem depender dos tipos internos do recharts v3
type ChartLegendContentProps = React.ComponentProps<"div"> & {
  payload?: Array<{
    value?: any
    dataKey?: string | number
    color?: string
    [key: string]: any
  }>
  verticalAlign?: "top" | "middle" | "bottom"
  hideIcon?: boolean
  nameKey?: string
}

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || ""}`
          const itemConfig = config[key]

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:size-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegendContent"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartContext,
}
