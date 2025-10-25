# 22. Form Handling & User Input

## Overview

Form handling connects user input to Server Actions with validation, error display, loading states, and optimistic updates. This implementation uses React Hook Form for state management, Zod for validation, and Server Actions for submission.

**Key Responsibilities:**
- Form state management with React Hook Form
- Client-side validation with Zod
- Server Action integration
- Optimistic UI updates
- Field-level and form-level error display
- Loading states during submission
- Success/failure feedback with toasts
- Accessibility (ARIA labels, focus management, error announcements)

## Prerequisites

**Phase Dependencies:**
- Phase 1: Database schema and types
- Phase 2: UI components (Button, Input, etc.)
- Server Actions defined (doc 18)
- Error handling utilities (doc 21)

**Required Packages:**
```bash
npm install react-hook-form
npm install @hookform/resolvers
npm install zod
npm install sonner
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Form Component                        │
│  useForm (React Hook Form)                              │
│    └─ Client-side state management                      │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  Zod Validation                          │
│  zodResolver validates input                            │
│    └─ Field-level errors shown immediately              │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼ (on submit)
┌─────────────────────────────────────────────────────────┐
│                  Optimistic Update                       │
│  useOptimistic shows expected result                    │
│    └─ UI updates before server responds                 │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                   Server Action                          │
│  Validates, processes, returns result                   │
│    └─ Success → Reset form, show toast                  │
│    └─ Error → Show errors, revert optimistic update     │
└─────────────────────────────────────────────────────────┘
```

## Next.js 16 Features

### Server Actions in Forms

```typescript
'use client'

import { useFormState } from 'react-dom'
import { myAction } from '@/app/actions'

export function MyForm() {
  const [state, formAction] = useFormState(myAction, null)

  return (
    <form action={formAction}>
      {/* form fields */}
    </form>
  )
}
```

### Optimistic Updates

```typescript
'use client'

import { useOptimistic } from 'react'

export function MyComponent({ data }: { data: MyData }) {
  const [optimisticData, setOptimisticData] = useOptimistic(data)

  async function handleSubmit(updates: Partial<MyData>) {
    // Update UI immediately
    setOptimisticData({ ...optimisticData, ...updates })

    // Submit to server
    const result = await myAction(updates)

    if (!result.success) {
      // Revert on error
      setOptimisticData(data)
    }
  }
}
```

## Complete Implementation

### lib/validation/schemas.ts

**Reusable Zod Schemas**

```typescript
import { z } from 'zod'

// ============================================================================
// Common Field Schemas
// ============================================================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')

export const urlSchema = z
  .string()
  .url('Must be a valid URL')

export const nonEmptyStringSchema = (fieldName: string) =>
  z.string().min(1, `${fieldName} is required`)

export const positiveNumberSchema = (fieldName: string) =>
  z.number().positive(`${fieldName} must be positive`)

export const dateStringSchema = z
  .string()
  .datetime('Must be a valid date')

// ============================================================================
// SEO Agent Schemas
// ============================================================================

export const seoResearchFormSchema = z.object({
  topic: z
    .string()
    .min(3, 'Topic must be at least 3 characters')
    .max(200, 'Topic must be less than 200 characters'),
  depth: z.enum(['basic', 'comprehensive']).default('comprehensive'),
  includeCompetitors: z.boolean().default(true),
})

export type SEOResearchFormValues = z.infer<typeof seoResearchFormSchema>

export const seoWriteFormSchema = z.object({
  brief: z
    .string()
    .min(50, 'Brief must be at least 50 characters')
    .max(2000, 'Brief must be less than 2000 characters'),
  targetWordCount: z
    .number()
    .min(500, 'Minimum 500 words')
    .max(5000, 'Maximum 5000 words')
    .default(1500),
  tone: z.enum(['professional', 'casual', 'technical']).default('professional'),
  keywords: z
    .array(z.string())
    .max(10, 'Maximum 10 keywords')
    .optional(),
})

export type SEOWriteFormValues = z.infer<typeof seoWriteFormSchema>

export const seoOptimizeFormSchema = z.object({
  url: urlSchema,
  focusAreas: z
    .array(z.enum(['readability', 'keywords', 'structure', 'links']))
    .min(1, 'Select at least one focus area')
    .optional(),
})

export type SEOOptimizeFormValues = z.infer<typeof seoOptimizeFormSchema>

// ============================================================================
// Email Agent Schemas
// ============================================================================

export const emailCreateFormSchema = z.object({
  brief: z
    .string()
    .min(20, 'Brief must be at least 20 characters')
    .max(1000, 'Brief must be less than 1000 characters'),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must be less than 100 characters'),
  tone: z.enum(['friendly', 'professional', 'urgent']).default('professional'),
  goal: z.enum(['nurture', 'conversion', 'announcement']),
})

export type EmailCreateFormValues = z.infer<typeof emailCreateFormSchema>

export const emailSeriesFormSchema = z.object({
  brief: z
    .string()
    .min(50, 'Brief must be at least 50 characters')
    .max(2000, 'Brief must be less than 2000 characters'),
  emailCount: z
    .number()
    .min(2, 'Minimum 2 emails')
    .max(10, 'Maximum 10 emails')
    .default(5),
  cadence: z.enum(['daily', 'weekly', 'biweekly']).default('weekly'),
  goal: z.enum(['onboarding', 'nurture', 'conversion']),
})

export type EmailSeriesFormValues = z.infer<typeof emailSeriesFormSchema>

// ============================================================================
// Content Schemas
// ============================================================================

export const createContentFormSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  content: z
    .string()
    .min(100, 'Content must be at least 100 characters'),
  type: z.enum(['blog_post', 'email', 'social_post', 'landing_page']),
  status: z.enum(['draft', 'review', 'published']).default('draft'),
  campaignId: z.string().uuid().optional(),
})

export type CreateContentFormValues = z.infer<typeof createContentFormSchema>

// ============================================================================
// Campaign Schemas
// ============================================================================

export const createCampaignFormSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  budget: positiveNumberSchema('Budget').optional(),
})
  .refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )

export type CreateCampaignFormValues = z.infer<typeof createCampaignFormSchema>
```

### components/forms/seo-research-form.tsx

**SEO Research Form Component**

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { triggerSEOResearch } from '@/app/actions/agents'
import { seoResearchFormSchema, type SEOResearchFormValues } from '@/lib/validation/schemas'
import { showErrorToast, showSuccessToast } from '@/components/error-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

// ============================================================================
// SEO Research Form
// ============================================================================

interface SEOResearchFormProps {
  onSuccess?: (jobId: string) => void
  onCancel?: () => void
}

export function SEOResearchForm({ onSuccess, onCancel }: SEOResearchFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SEOResearchFormValues>({
    resolver: zodResolver(seoResearchFormSchema),
    defaultValues: {
      topic: '',
      depth: 'comprehensive',
      includeCompetitors: true,
    },
  })

  async function onSubmit(values: SEOResearchFormValues) {
    setIsSubmitting(true)

    try {
      const result = await triggerSEOResearch(values)

      if (result.success) {
        showSuccessToast('Research started', {
          description: 'The SEO research job has been queued.',
        })

        form.reset()
        onSuccess?.(result.data.id)
      } else {
        showErrorToast(result.error, {
          severity: result.severity,
        })
      }
    } catch (error) {
      showErrorToast('Failed to start research', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Topic Field */}
        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., AI Marketing Automation"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                The topic you want to research for SEO opportunities.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Depth Field */}
        <FormField
          control={form.control}
          name="depth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Research Depth</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select depth" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Basic: Quick overview. Comprehensive: Deep analysis.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Include Competitors Field */}
        <FormField
          control={form.control}
          name="includeCompetitors"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Include Competitor Analysis</FormLabel>
                <FormDescription>
                  Analyze competitor content and strategies.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Research
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
```

### components/forms/seo-write-form.tsx

**SEO Write Form Component**

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { triggerSEOWrite } from '@/app/actions/agents'
import { seoWriteFormSchema, type SEOWriteFormValues } from '@/lib/validation/schemas'
import { showErrorToast, showSuccessToast } from '@/components/error-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

// ============================================================================
// SEO Write Form
// ============================================================================

interface SEOWriteFormProps {
  onSuccess?: (jobId: string) => void
  onCancel?: () => void
}

export function SEOWriteForm({ onSuccess, onCancel }: SEOWriteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')

  const form = useForm<SEOWriteFormValues>({
    resolver: zodResolver(seoWriteFormSchema),
    defaultValues: {
      brief: '',
      targetWordCount: 1500,
      tone: 'professional',
      keywords: [],
    },
  })

  const addKeyword = () => {
    if (keywordInput.trim() && keywords.length < 10) {
      const newKeywords = [...keywords, keywordInput.trim()]
      setKeywords(newKeywords)
      form.setValue('keywords', newKeywords)
      setKeywordInput('')
    }
  }

  const removeKeyword = (index: number) => {
    const newKeywords = keywords.filter((_, i) => i !== index)
    setKeywords(newKeywords)
    form.setValue('keywords', newKeywords)
  }

  async function onSubmit(values: SEOWriteFormValues) {
    setIsSubmitting(true)

    try {
      const result = await triggerSEOWrite(values)

      if (result.success) {
        showSuccessToast('Article writing started', {
          description: 'Your SEO article is being generated.',
        })

        form.reset()
        setKeywords([])
        onSuccess?.(result.data.id)
      } else {
        showErrorToast(result.error, {
          severity: result.severity,
        })
      }
    } catch (error) {
      showErrorToast('Failed to start article writing', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Brief Field */}
        <FormField
          control={form.control}
          name="brief"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Brief</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what you want the article to cover..."
                  className="min-h-[120px]"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Provide a detailed brief for the SEO article (minimum 50 characters).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Word Count Field */}
        <FormField
          control={form.control}
          name="targetWordCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Word Count</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={500}
                  max={5000}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Target length for the article (500-5000 words).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tone Field */}
        <FormField
          control={form.control}
          name="tone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tone</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The writing style and tone for the article.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Keywords Field */}
        <FormField
          control={form.control}
          name="keywords"
          render={() => (
            <FormItem>
              <FormLabel>Target Keywords (Optional)</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter keyword..."
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addKeyword()
                        }
                      }}
                      disabled={isSubmitting || keywords.length >= 10}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addKeyword}
                      disabled={
                        isSubmitting || !keywordInput.trim() || keywords.length >= 10
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(index)}
                            className="ml-2"
                            disabled={isSubmitting}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Add up to 10 keywords to target in the article.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Article
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
```

### components/forms/campaign-form.tsx

**Campaign Creation Form with Multi-Step Wizard**

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { createCampaign } from '@/app/actions/campaigns'
import { createCampaignFormSchema, type CreateCampaignFormValues } from '@/lib/validation/schemas'
import { showErrorToast, showSuccessToast } from '@/components/error-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

// ============================================================================
// Multi-Step Campaign Form
// ============================================================================

interface CampaignFormProps {
  onSuccess?: (campaignId: string) => void
  onCancel?: () => void
}

export function CampaignForm({ onSuccess, onCancel }: CampaignFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const totalSteps = 3

  const form = useForm<CreateCampaignFormValues>({
    resolver: zodResolver(createCampaignFormSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    },
    mode: 'onChange', // Validate on change for multi-step
  })

  const nextStep = async () => {
    let fieldsToValidate: Array<keyof CreateCampaignFormValues> = []

    switch (step) {
      case 1:
        fieldsToValidate = ['name', 'description']
        break
      case 2:
        fieldsToValidate = ['startDate', 'endDate']
        break
    }

    const isValid = await form.trigger(fieldsToValidate)

    if (isValid) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  async function onSubmit(values: CreateCampaignFormValues) {
    setIsSubmitting(true)

    try {
      const result = await createCampaign(values)

      if (result.success) {
        showSuccessToast('Campaign created', {
          description: `"${values.name}" has been created successfully.`,
        })

        form.reset()
        setStep(1)
        onSuccess?.(result.data.id)
      } else {
        showErrorToast(result.error, {
          severity: result.severity,
        })
      }
    } catch (error) {
      showErrorToast('Failed to create campaign', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (step / totalSteps) * 100

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Q1 Product Launch"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for your campaign.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the campaign goals and strategy..."
                        className="min-h-[100px]"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Additional details about the campaign.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: Dates */}
          {step === 2 && (
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value.slice(0, 16)} // Format for datetime-local
                        onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      When should the campaign begin?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value.slice(0, 16)}
                        onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      When should the campaign end?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 3: Budget */}
          {step === 3 && (
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value ? parseFloat(value) : undefined)
                        }}
                        value={field.value ?? ''}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Total budget allocated for this campaign.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Summary */}
              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="font-semibold">Campaign Summary</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {form.watch('name')}</p>
                  <p><strong>Start:</strong> {new Date(form.watch('startDate')).toLocaleDateString()}</p>
                  <p><strong>End:</strong> {new Date(form.watch('endDate')).toLocaleDateString()}</p>
                  {form.watch('budget') && (
                    <p><strong>Budget:</strong> ${form.watch('budget')?.toFixed(2)}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}

            {step < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={isSubmitting}
                className="flex-1"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Campaign
              </Button>
            )}

            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
```

## Type Safety

### Form Values Type Inference

```typescript
// Schema defines types
const mySchema = z.object({
  name: z.string(),
  count: z.number(),
})

// Infer TypeScript type
type MyFormValues = z.infer<typeof mySchema>
// Equivalent to: { name: string; count: number }

// Use in form
const form = useForm<MyFormValues>({
  resolver: zodResolver(mySchema),
})
```

## Error Handling

### Field-Level Errors

```typescript
<FormMessage /> // Automatically shows field errors from validation
```

### Form-Level Errors

```typescript
// Set form-level error
form.setError('root', {
  type: 'manual',
  message: 'Failed to submit form',
})

// Display form-level error
{form.formState.errors.root && (
  <Alert variant="destructive">
    <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
  </Alert>
)}
```

## Testing

### Form Component Tests

```typescript
// components/forms/__tests__/seo-research-form.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SEOResearchForm } from '../seo-research-form'
import * as agentActions from '@/app/actions/agents'

vi.mock('@/app/actions/agents')

describe('SEOResearchForm', () => {
  it('should validate required fields', async () => {
    render(<SEOResearchForm />)

    const submitButton = screen.getByRole('button', { name: /start research/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/topic must be at least 3 characters/i)).toBeInTheDocument()
    })
  })

  it('should submit valid form', async () => {
    vi.mocked(agentActions.triggerSEOResearch).mockResolvedValue({
      success: true,
      data: { id: 'job-123' } as any,
    })

    const onSuccess = vi.fn()
    render(<SEOResearchForm onSuccess={onSuccess} />)

    const topicInput = screen.getByPlaceholderText(/ai marketing/i)
    fireEvent.change(topicInput, { target: { value: 'AI Marketing' } })

    const submitButton = screen.getByRole('button', { name: /start research/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('job-123')
    })
  })
})
```

## Performance

### Form Performance Optimization

```typescript
// Use mode: 'onBlur' for better performance
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur', // Validate on blur, not on every keystroke
})
```

## Troubleshooting

### Issue: Form Not Submitting

**Symptom:** Form submission doesn't trigger Server Action

**Solution:**
```typescript
// Ensure handleSubmit wraps Server Action
<form onSubmit={form.handleSubmit(onSubmit)}>
  {/* NOT: <form action={serverAction}> */}
</form>
```

### Issue: Validation Not Working

**Symptom:** Invalid data submitted

**Solution:**
```typescript
// Ensure zodResolver is configured
const form = useForm({
  resolver: zodResolver(mySchema), // Required!
})
```

## Next Steps

**Phase 5 Integration:**
- Wire forms to dashboard UI
- Test all form flows
- Add accessibility testing
- Implement form analytics
- Monitor validation errors

**Action Items:**
1. Create all form components
2. Implement validation schemas
3. Add form tests
4. Test accessibility
5. Optimize performance
6. Document form patterns

**Dependencies:**
- Previous: Document 18 (Server Actions)
- Previous: Document 21 (Error Handling)
- Next: Phase 5 (Full integration)
