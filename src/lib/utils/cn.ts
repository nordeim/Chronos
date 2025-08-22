// chronos/src/lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combine class names with tailwind-merge
 * This function combines multiple class names and merges Tailwind CSS classes intelligently
 * to avoid conflicts and ensure the last class takes precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Conditional class names
 * Apply classes based on conditions
 */
export function cx(
  ...args: Array<ClassValue | [boolean, ClassValue] | [boolean, ClassValue, ClassValue]>
): string {
  const classes: ClassValue[] = []

  for (const arg of args) {
    if (Array.isArray(arg)) {
      const [condition, trueClass, falseClass] = arg
      if (condition) {
        classes.push(trueClass)
      } else if (falseClass) {
        classes.push(falseClass)
      }
    } else {
      classes.push(arg)
    }
  }

  return cn(...classes)
}

/**
 * Variant class helper
 * Create variant-based class names
 */
export function variants<T extends Record<string, Record<string, ClassValue>>>(
  config: T
) {
  return function getVariantClasses<
    V extends keyof T,
    K extends keyof T[V]
  >(
    variant: V,
    key: K,
    className?: ClassValue
  ): string {
    return cn(config[variant]?.[key], className)
  }
}

/**
 * Create className getter with base classes
 */
export function createStyles<T extends Record<string, ClassValue>>(
  styles: T
) {
  return function getClassName<K extends keyof T>(
    key: K,
    ...additional: ClassValue[]
  ): string {
    return cn(styles[key], ...additional)
  }
}

/**
 * Compose multiple className functions
 */
export function composeStyles(
  ...functions: Array<(...args: any[]) => string>
) {
  return function composedStyles(...args: ClassValue[]): string {
    const classes = functions.map(fn => fn())
    return cn(...classes, ...args)
  }
}

export default cn
