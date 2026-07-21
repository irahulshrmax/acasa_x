import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/database";

interface EnquiryPayload {
  property_id?: number | null;
  project_item_id?: number | null;
  project_id?: number | null;
  item_type?: string;
  type?: string;
  source?: string;
  agent_id?: number | null;
  country?: string;
  message?: string;
  contact_type?: string;
  listing_type?: string;
  contact_source?: string;
  lead_source?: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: number;
  lead_status?: number;
  zoho_synced?: number;
  property_name?: string;
  ref_number?: string;
  agent_name?: string | null;
  agent_phone?: string | null;
  agent_email?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: EnquiryPayload = await request.json();

    const {
      property_id,
      project_item_id,
      project_id,
      item_type = "property",
      type = "Inquiry",
      source = "Website",
      agent_id,
      country = "AE",
      message,
      contact_type = "Buyer",
      listing_type = "For Sale",
      contact_source = "Website",
      lead_source = "Website",
      name,
      email,
      phone,
      status = 1,
      lead_status = 1,
      zoho_synced = 0,
      property_name,
      ref_number,
      agent_name,
      agent_phone,
      agent_email,
    } = body;

    const errors: string[] = [];

    if (!name || name.trim() === "") {
      errors.push("Name is required");
    }

    if (!email || !email.includes("@") || !email.includes(".")) {
      errors.push("Valid email is required");
    }

    if (!phone || phone.trim() === "") {
      errors.push("Phone is required");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    const primaryId = property_id || project_item_id || project_id || null;
    const isProject = item_type === "project" || !!(project_item_id || project_id);

    try {
      const columns = await query<any[]>("SHOW COLUMNS FROM enquire");
      const columnNames = (columns as any[]).map((col: any) => col.Field);

      const missingColumns: string[] = [];

      const requiredColumns = [
        { name: "name", type: "VARCHAR(255) NULL" },
        { name: "email", type: "VARCHAR(255) NULL" },
        { name: "phone", type: "VARCHAR(100) NULL" },
        { name: "property_name", type: "VARCHAR(255) NULL" },
        { name: "ref_number", type: "VARCHAR(100) NULL" },
        { name: "agent_name", type: "VARCHAR(255) NULL" },
        { name: "agent_phone", type: "VARCHAR(100) NULL" },
        { name: "agent_email", type: "VARCHAR(255) NULL" },
        { name: "project_id", type: "INT NULL" },
      ];

      requiredColumns.forEach((col) => {
        if (!columnNames.includes(col.name)) {
          missingColumns.push(`${col.name} ${col.type}`);
        }
      });

      if (missingColumns.length > 0) {
        await query(`
          ALTER TABLE enquire 
          ${missingColumns.map(col => `ADD COLUMN IF NOT EXISTS ${col}`).join(', ')}
        `);
      }

      const countryCol = (columns as any[]).find((col: any) => col.Field === "country");
      if (countryCol && countryCol.Type && countryCol.Type.includes("int")) {
        await query(`ALTER TABLE enquire MODIFY COLUMN country VARCHAR(10) NULL`);
      }
    } catch (err: any) {
    }

    const insertData = {
      property_id: isProject ? null : primaryId,
      project_item_id: isProject ? primaryId : null,
      project_id: isProject ? primaryId : null,
      item_type,
      type,
      source,
      agent_id: agent_id || null,
      country: country || "AE",
      message: message || null,
      contact_type: contact_type || "Buyer",
      listing_type: listing_type || "For Sale",
      contact_source: contact_source || "Website",
      lead_source: lead_source || "Website",
      name: name || null,
      email: email || null,
      phone: phone || null,
      property_name: property_name || null,
      ref_number: ref_number || null,
      agent_name: agent_name || null,
      agent_phone: agent_phone || null,
      agent_email: agent_email || null,
      status: status || 1,
      lead_status: lead_status || 1,
      zoho_synced: zoho_synced || 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await insert<{ insertId: number }>("enquire", insertData);

    const insertId = (result as any)[0] || (result as any).insertId;

    let zohoLeadId = null;

    try {
      const zohoResponse = await syncToZoho({
        name: name || "Unknown",
        email: email || "",
        phone: phone || "",
        property_name: property_name || "New Enquiry",
        message: message || "",
        source: source || "Website",
      });

      if (zohoResponse?.id) {
        zohoLeadId = zohoResponse.id;

        await query(
          `UPDATE enquire SET zoho_lead_id = ?, zoho_synced = 1, synced_at = NOW() WHERE id = ?`,
          [zohoLeadId, insertId]
        );
      }
    } catch (zohoError: any) {
    }

    return NextResponse.json({
      success: true,
      message: "Enquiry submitted successfully",
      data: {
        id: insertId,
        zoho_lead_id: zohoLeadId,
      },
    });
  } catch (error: any) {
    if (error.message?.includes("Unknown column")) {
      return NextResponse.json(
        {
          success: false,
          message: "Database column missing. Please run migration.",
          error: error.message,
          suggestion: "ALTER TABLE enquire ADD COLUMN name VARCHAR(255) NULL",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit enquiry",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

async function syncToZoho(data: {
  name: string;
  email: string;
  phone: string;
  property_name: string;
  message: string;
  source: string;
}) {
  try {
    const tokenResponse = await fetch("https://accounts.zoho.in/oauth/v2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
        client_id: process.env.ZOHO_CLIENT_ID!,
        client_secret: process.env.ZOHO_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("Failed to get Zoho access token");
    }

    const leadPayload = {
      data: [
        {
          Last_Name: data.name,
          Email: data.email,
          Phone: data.phone,
          Description: data.message || "No message provided",
          Lead_Source: data.source || "Website",
          Company: data.property_name || "Acasa Property",
          Lead_Status: "New",
        },
      ],
    };

    const leadResponse = await fetch(
      "https://www.zohoapis.in/crm/v3/Leads",
      {
        method: "POST",
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadPayload),
      }
    );

    const leadData = await leadResponse.json();

    if (!leadResponse.ok) {
      throw new Error(`Zoho API error: ${leadResponse.status}`);
    }

    return leadData.data?.[0] || null;
  } catch (error: any) {
    return null;
  }
}