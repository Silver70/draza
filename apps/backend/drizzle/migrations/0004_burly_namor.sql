CREATE TYPE "public"."campaign_type" AS ENUM('post', 'reel', 'story', 'video', 'ad', 'campaign');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('mobile', 'tablet', 'desktop', 'other');--> statement-breakpoint
CREATE TYPE "public"."campaign_platform" AS ENUM('instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'multi', 'other');--> statement-breakpoint
CREATE TABLE "campaign_analytics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"snapshot_date" date NOT NULL,
	"snapshot_hour" integer,
	"total_visits" integer DEFAULT 0 NOT NULL,
	"unique_visitors" integer DEFAULT 0 NOT NULL,
	"total_conversions" integer DEFAULT 0 NOT NULL,
	"total_revenue" numeric(10, 2) DEFAULT '0' NOT NULL,
	"conversion_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"roi" numeric(10, 2) DEFAULT '0' NOT NULL,
	"average_order_value" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_analytics_snapshots_campaign_id_snapshot_date_snapshot_hour_unique" UNIQUE("campaign_id","snapshot_date","snapshot_hour")
);
--> statement-breakpoint
CREATE TABLE "campaign_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"visit_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"revenue" numeric(10, 2) NOT NULL,
	"converted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"customer_id" uuid,
	"ip_address" text,
	"user_agent" text,
	"referrer" text,
	"landing_page" text,
	"country" text,
	"city" text,
	"device_type" "device_type",
	"visited_at" timestamp DEFAULT now() NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"converted" boolean DEFAULT false NOT NULL,
	"conversion_at" timestamp,
	"attributed_order_id" uuid,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_campaign_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"platform" "campaign_platform" NOT NULL,
	"campaign_type" "campaign_type" NOT NULL,
	"post_url" text,
	"tracking_code" text NOT NULL,
	"cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"budget" numeric(10, 2) DEFAULT '0' NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_tracking_code_unique" UNIQUE("tracking_code")
);
--> statement-breakpoint
ALTER TABLE "customers_table" ADD COLUMN "acquisition_campaign_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "campaign_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "visit_id" uuid;--> statement-breakpoint
ALTER TABLE "campaign_analytics_snapshots" ADD CONSTRAINT "campaign_analytics_snapshots_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_conversions" ADD CONSTRAINT "campaign_conversions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_conversions" ADD CONSTRAINT "campaign_conversions_visit_id_campaign_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."campaign_visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_conversions" ADD CONSTRAINT "campaign_conversions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_conversions" ADD CONSTRAINT "campaign_conversions_customer_id_customers_table_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_visits" ADD CONSTRAINT "campaign_visits_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_visits" ADD CONSTRAINT "campaign_visits_customer_id_customers_table_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_visits" ADD CONSTRAINT "campaign_visits_attributed_order_id_orders_id_fk" FOREIGN KEY ("attributed_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_parent_campaign_id_campaigns_id_fk" FOREIGN KEY ("parent_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;