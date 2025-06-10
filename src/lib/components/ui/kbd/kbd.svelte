<script lang="ts" module>
  import { tv, type VariantProps } from "tailwind-variants";
  import type { WithChildren } from "bits-ui";

  const style = tv({
    base: "inline-flex place-items-center justify-center gap-1 rounded-md p-0.5",
    variants: {
      variant: {
        outline: "border-border bg-background text-muted-foreground border",
        secondary: "bg-secondary text-muted-foreground",
        primary: "bg-primary text-primary-foreground",
      },
      size: {
        sm: "min-w-6 gap-1.5 p-0.5 px-1 text-sm",
        default: "min-w-8 gap-1.5 p-1 px-2",
        lg: "min-w-9 gap-2 p-1 px-3 text-lg",
      },
    },
  });

  type Size = VariantProps<typeof style>["size"];
  type Variant = VariantProps<typeof style>["variant"];

  export type KbdPropsWithoutHTML = WithChildren<{
    ref?: HTMLElement | null;
    class?: string;
    size?: Size;
    variant?: Variant;
  }>;

  export type KbdProps = KbdPropsWithoutHTML;
</script>

<script lang="ts">
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    size = "default",
    variant = "outline",
    children,
  }: KbdProps = $props();
</script>

<kbd bind:this={ref} class={cn(style({ size, variant }), className)}>
  {@render children?.()}
</kbd>
