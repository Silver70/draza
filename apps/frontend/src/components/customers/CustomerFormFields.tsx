import { Input } from '~/components/ui/input'
import { Field, FieldLabel, FieldDescription, FieldError } from '~/components/ui/field'
import type { FieldApi } from '@tanstack/react-form'

type CustomerFormFieldsProps = {
  firstNameField: FieldApi<any, any, any, any>
  lastNameField: FieldApi<any, any, any, any>
  emailField: FieldApi<any, any, any, any>
  phoneNumberField: FieldApi<any, any, any, any>
}

export function CustomerFormFields({
  firstNameField,
  lastNameField,
  emailField,
  phoneNumberField,
}: CustomerFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* First Name */}
      <Field>
        <FieldLabel htmlFor="first_name">First Name *</FieldLabel>
        <Input
          id="first_name"
          placeholder="e.g., John"
          value={firstNameField.state.value}
          onChange={(e) => firstNameField.handleChange(e.target.value)}
          onBlur={firstNameField.handleBlur}
        />
        <FieldDescription>Enter the customer's first name.</FieldDescription>
        {firstNameField.state.meta.errors && firstNameField.state.meta.errors.length > 0 && (
          <FieldError errors={firstNameField.state.meta.errors.map(error => ({ message: error }))} />
        )}
      </Field>

      {/* Last Name */}
      <Field>
        <FieldLabel htmlFor="last_name">Last Name *</FieldLabel>
        <Input
          id="last_name"
          placeholder="e.g., Doe"
          value={lastNameField.state.value}
          onChange={(e) => lastNameField.handleChange(e.target.value)}
          onBlur={lastNameField.handleBlur}
        />
        <FieldDescription>Enter the customer's last name.</FieldDescription>
        {lastNameField.state.meta.errors && lastNameField.state.meta.errors.length > 0 && (
          <FieldError errors={lastNameField.state.meta.errors.map(error => ({ message: error }))} />
        )}
      </Field>

      {/* Email */}
      <Field>
        <FieldLabel htmlFor="email">Email *</FieldLabel>
        <Input
          id="email"
          type="email"
          placeholder="e.g., john.doe@example.com"
          value={emailField.state.value}
          onChange={(e) => emailField.handleChange(e.target.value)}
          onBlur={emailField.handleBlur}
        />
        <FieldDescription>Enter a valid email address.</FieldDescription>
        {emailField.state.meta.errors && emailField.state.meta.errors.length > 0 && (
          <FieldError errors={emailField.state.meta.errors.map(error => ({ message: error }))} />
        )}
      </Field>

      {/* Phone Number */}
      <Field>
        <FieldLabel htmlFor="phone_number">Phone Number *</FieldLabel>
        <Input
          id="phone_number"
          type="tel"
          placeholder="e.g., (555) 123-4567"
          value={phoneNumberField.state.value}
          onChange={(e) => phoneNumberField.handleChange(e.target.value)}
          onBlur={phoneNumberField.handleBlur}
        />
        <FieldDescription>Enter the customer's phone number.</FieldDescription>
        {phoneNumberField.state.meta.errors && phoneNumberField.state.meta.errors.length > 0 && (
          <FieldError errors={phoneNumberField.state.meta.errors.map(error => ({ message: error }))} />
        )}
      </Field>
    </div>
  )
}
