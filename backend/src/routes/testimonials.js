const express = require("express");
const { v4: uuid } = require("uuid");

const db = require("../db/db");
const { upload } = require("../middleware/upload");

const router = express.Router();

const VALID_STATUSES = new Set(["pending", "approved", "rejected"]);
const MUTABLE_STATUSES = new Set(["approved", "rejected"]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeTextPreview(text) {
  return String(text || "")
    .trim()
    .slice(0, 100)
    .toLowerCase();
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function validateSubmission(body) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const company = String(body.company || "").trim();
  const text = String(body.text || "").trim();
  const rating = Number.parseInt(body.rating, 10);

  if (!name || name.length < 1 || name.length > 100) {
    return { error: "Name is required and must be between 1 and 100 characters." };
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return { error: "A valid email is required." };
  }

  if (!text || text.length < 10 || text.length > 2000) {
    return { error: "Text is required and must be between 10 and 2000 characters." };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating is required and must be an integer between 1 and 5." };
  }

  return {
    value: {
      name,
      email,
      company,
      text,
      rating,
    },
  };
}

async function hasDuplicate(email, text) {
  const normalizedPreview = normalizeTextPreview(text);
  const { data } = await db.request({
    query: {
      select: "id,text,status",
      email: `eq.${email}`,
      status: "neq.rejected",
    },
  });

  return Array.isArray(data)
    ? data.some((row) => normalizeTextPreview(row.text) === normalizedPreview)
    : false;
}

async function fetchById(id) {
  const { data } = await db.request({
    query: {
      select: "*",
      id: `eq.${id}`,
      limit: 1,
    },
  });

  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

router.post("/", upload.single("photo"), async (req, res, next) => {
  try {
    const validation = validateSubmission(req.body);

    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const { name, email, company, text, rating } = validation.value;

    if (await hasDuplicate(email, text)) {
      return res.status(409).json({
        error: "A similar testimonial from this email already exists.",
      });
    }

    const id = uuid();
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    await db.request({
      method: "POST",
      body: {
        id,
        name,
        email,
        company,
        text,
        rating,
        photo_url: photoUrl,
      },
      query: {
        select: "id",
      },
      headers: {
        Prefer: "return=representation",
      },
    });

    return res.status(201).json({
      id,
      message: "Testimonial submitted successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const status = req.query.status;
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20);
    const offset = (page - 1) * limit;

    if (status && !VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: "Invalid status filter." });
    }

    const query = {
      select: "*",
      order: "created_at.desc",
      limit,
      offset,
    };

    if (status) {
      query.status = `eq.${status}`;
    }

    const { data, headers } = await db.request({
      query,
      headers: {
        Prefer: "count=exact",
      },
    });

    const contentRange = headers.get("content-range") || "";
    const total = contentRange.includes("/")
      ? Number.parseInt(contentRange.split("/")[1], 10) || 0
      : Array.isArray(data)
      ? data.length
      : 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return res.json({
      data: Array.isArray(data) ? data : [],
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/public", async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 12);
    const offset = (page - 1) * limit;

    const { data, headers } = await db.request({
      query: {
        select: "id,name,company,text,rating,photo_url,created_at",
        status: "eq.approved",
        order: "created_at.desc",
        limit,
        offset,
      },
      headers: {
        Prefer: "count=exact",
      },
    });

    const contentRange = headers.get("content-range") || "";
    const total = contentRange.includes("/")
      ? Number.parseInt(contentRange.split("/")[1], 10) || 0
      : Array.isArray(data)
      ? data.length
      : 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return res.json({
      data: Array.isArray(data) ? data : [],
      total,
      page,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = req.body && req.body.status;

    if (!MUTABLE_STATUSES.has(status)) {
      return res.status(400).json({ error: "Status must be approved or rejected." });
    }

    const existing = await fetchById(id);

    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    await db.request({
      method: "PATCH",
      query: {
        id: `eq.${id}`,
        select: "id,status",
      },
      body: { status },
      headers: {
        Prefer: "return=representation",
      },
    });

    return res.status(200).json({ id, status });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await fetchById(id);

    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    await db.request({
      method: "DELETE",
      query: {
        id: `eq.${id}`,
      },
    });

    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
