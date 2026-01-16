import { Input } from '~/components/ui/input'
import { Field, FieldLabel, FieldDescription, FieldError } from '~/components/ui/field'
import type { FieldApi } from '@tanstack/react-form'

type AddressFormFieldsProps = {
  firstNameField: FieldApi<any, any, any, any>
  lastNameField: FieldApi<any, any, any, any>
  phoneNumberField: FieldApi<any, any, any, any>
  streetAddressField: FieldApi<any, any, any, any>
  apartmentField: FieldApi<any, any, any, any>
  cityField: FieldApi<any, any, any, any>
  stateField: FieldApi<any, any, any, any>
  postalCodeField: FieldApi<any, any, any, any>
  countryField: FieldApi<any, any, any, any>
}

export function AddressFormFields({
  firstNameField,
  lastNameField,
  phoneNumberField,
  streetAddressField,
  apartmentField,
  cityField,
  stateField,
  postalCodeField,
  countryField,
}: AddressFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* First Name */}
      <Field>
        <FieldLabel htmlFor="firstName">First Name *</FieldLabel>
        <Input
          id="firstName"
          placeholder="e.g., John"
          value={firstNameField.state.value}
          onChange={(e) => firstNameField.handleChange(e.target.value)}
          onBlur={firstNameField.handleBlur}
        />
        {firstNameField.state.meta.errors && firstNameField.state.meta.errors.length > 0 && (
          <FieldError errors={firstNameField.state.meta.errors.map(error => ({ message: error }))} />
        )}
      </Field>

      {/* Last Name */}
      <Field>
        <FieldLabel htmlFor="lastName">Last Name *</FieldLabel>
        <Input
          id="lastName"
          placeholder="e.g., Doe"
          value={lastNameField.state.value}
          onChange={(e) => lastNameField.handleChange(e.target.value)}
          onBlur={lastNameField.handleBlur}
        />
        {lastNameField.state.meta.errors && lastNameField.state.meta.errors.length > 0 && (
          <FieldError errors={lastNameField.state.meta.errors.map(error => ({ message: error }))} />
        )}
      </Field>

      {/* Phone Number */}
      <Field>
        <FieldLabel htmlFor="phoneNumber">Phone Number *</FieldLabel>
        <Input
          id="phoneNumber"
          type="tel"
          placeholder="e.g., (555) 123-4567"
          value={phoneNumberField.state.value}
          onChange={(e) => phoneNumberField.handleChange(e.target.value)}
          onBlur={phoneNumberField.handleBlur}
        />
        {phoneNumberField.state.meta.errors && phoneNumberField.state.meta.errors.length > 0 && (
          <FieldError errors={phoneNumberField.state.meta.errors.map(error => ({ message: error }))} />
        )}
      </Field>

      {/* Street Address */}
      <Field>
        <FieldLabel htmlFor="streetAddress">Street Address *</FieldLabel>
        <Input
          id="streetAddress"
          placeholder="e.g., 123 Main St"
          value={streetAddressField.state.value}
          onChange={(e) => streetAddressField.handleChange(e.target.value)}
          onBlur={streetAddressField.handleBlur}
        />
        {streetAddressField.state.meta.errors && streetAddressField.state.meta.errors.length > 0 && (
          <FieldError errors={streetAddressField.state.meta.errors.map(error => ({ message: error }))} />
        )}
      </Field>

      {/* Apartment */}
      <Field>
        <FieldLabel htmlFor="apartment">Apartment/Suite</FieldLabel>
        <Input
          id="apartment"
          placeholder="e.g., Apt 4B"
          value={apartmentField.state.value}
          onChange={(e) => apartmentField.handleChange(e.target.value)}
        />
      </Field>

      {/* City */}
      <Field>
        <FieldLabel htmlFor="city">City *</FieldLabel>
        <Input
          id="city"
          placeholder="e.g., New York"
          value={cityField.state.value}
          onChange={(e) => cityField.handleChange(e.target.value)}
          onBlur={cityField.handleBlur}
        />
        {cityField.state.meta.errors && cityField.state.meta.errors.length > 0 && (
          <FieldError errors={cityField.state.meta.errors.map(error => ({ message: error }))} />
        )}
      </Field>

      {/* State */}
      <Field>
        <FieldLabel htmlFor="state">State *</FieldLabel>
        <Input
          id="state"
          placeholder="e.g., NY"
          value={stateField.state.value}
          onChange={(e) => stateField.handleChange(e.target.value)}
          onBlur={stateField.handleBlur}
        />
        {stateField.state.meta.errors && stateField.state.meta.errors.length > 0 && (
          <FieldError errors={stateField.state.meta.errors.map(error => ({ message: error }))} />
        )}
      </Field>

      {/* Postal Code */}
      <Field>
        <FieldLabel htmlFor="postalCode">Postal Code *</FieldLabel>
        <Input
          id="postalCode"
          placeholder="e.g., 10001"
          value={postalCodeField.state.value}
          onChange={(e) => postalCodeField.handleChange(e.target.value)}
          onBlur={postalCodeField.handleBlur}
        />
        {postalCodeField.state.meta.errors && postalCodeField.state.meta.errors.length > 0 && (
          <FieldError errors={postalCodeField.state.meta.errors.map(error => ({ message: error }))} />
        )}
      </Field>

      {/* Country */}
      <Field>
        <FieldLabel htmlFor="country">Country</FieldLabel>
        <Input
          id="country"
          placeholder="e.g., USA"
          value={countryField.state.value}
          onChange={(e) => countryField.handleChange(e.target.value)}
        />
      </Field>
    </div>
  )
}
