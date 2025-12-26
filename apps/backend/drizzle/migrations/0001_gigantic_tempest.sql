CREATE TYPE "public"."jurisdiction_type" AS ENUM('country', 'state', 'county', 'city');--> statement-breakpoint
CREATE TYPE "public"."shipping_calculation_type" AS ENUM('flat_rate', 'weight_based', 'price_tier', 'free_threshold');--> statement-breakpoint
CREATE TYPE "public"."shipping_carrier" AS ENUM('usps', 'fedex', 'ups', 'dhl', 'other');--> statement-breakpoint
CREATE TABLE "product_tax_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"is_tax_exempt" boolean DEFAULT false NOT NULL,
	"exemption_category" text,
	"exemption_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_tax_settings_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "tax_jurisdictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "jurisdiction_type" NOT NULL,
	"country" text DEFAULT 'USA' NOT NULL,
	"state_code" text,
	"county_name" text,
	"city_name" text,
	"rate" numeric(5, 4) NOT NULL,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"carrier" "shipping_carrier" NOT NULL,
	"calculation_type" "shipping_calculation_type" NOT NULL,
	"base_rate" numeric(10, 2) NOT NULL,
	"free_shipping_threshold" numeric(10, 2),
	"estimated_days_min" integer,
	"estimated_days_max" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_rate_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipping_method_id" uuid NOT NULL,
	"min_value" numeric(10, 2) NOT NULL,
	"max_value" numeric(10, 2),
	"rate" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tax_jurisdiction_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tax_jurisdiction_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tax_rate" numeric(5, 4);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_method_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_method_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_carrier" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "estimated_delivery_date" timestamp;--> statement-breakpoint
ALTER TABLE "product_tax_settings" ADD CONSTRAINT "product_tax_settings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rate_tiers" ADD CONSTRAINT "shipping_rate_tiers_shipping_method_id_shipping_methods_id_fk" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tax_jurisdiction_id_tax_jurisdictions_id_fk" FOREIGN KEY ("tax_jurisdiction_id") REFERENCES "public"."tax_jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_method_id_shipping_methods_id_fk" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE no action ON UPDATE no action;