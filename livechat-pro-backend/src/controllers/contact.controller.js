import Contact from "../models/Contact.js";
import Conversation from "../models/Conversation.js";
import Visitor from "../models/Visitor.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { toCsv } from "../utils/csv.js";

export const listContacts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, tag } = req.query;

  const query = { workspace: req.workspaceId, mergedInto: null };

  if (search) {
    query.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { company: new RegExp(search, "i") }
    ];
  }

  if (tag) {
    query.tags = tag;
  }

  const [items, total] = await Promise.all([
    Contact.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Contact.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total }
    }
  });
});

export const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({ _id: req.params.id, workspace: req.workspaceId, mergedInto: null });
  if (!contact) throw new ApiError(404, "Contact not found");

  const timeline = await Conversation.find({ workspace: req.workspaceId, contact: contact._id })
    .populate("assignedTo", "name avatar")
    .sort({ lastMessageAt: -1 });

  res.json({
    success: true,
    data: {
      contact,
      timeline
    }
  });
});

export const updateContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOneAndUpdate(
    { _id: req.params.id, workspace: req.workspaceId, mergedInto: null },
    { $set: req.body },
    { new: true }
  );

  if (!contact) throw new ApiError(404, "Contact not found");

  res.json({
    success: true,
    data: contact
  });
});

export const mergeContacts = asyncHandler(async (req, res) => {
  const { primaryContactId, duplicateContactId } = req.body;
  if (!primaryContactId || !duplicateContactId) {
    throw new ApiError(400, "primaryContactId and duplicateContactId are required");
  }
  if (primaryContactId === duplicateContactId) {
    throw new ApiError(400, "Contacts must be different");
  }

  const [primary, duplicate] = await Promise.all([
    Contact.findOne({ _id: primaryContactId, workspace: req.workspaceId, mergedInto: null }),
    Contact.findOne({ _id: duplicateContactId, workspace: req.workspaceId, mergedInto: null })
  ]);

  if (!primary || !duplicate) throw new ApiError(404, "One or both contacts not found");

  primary.tags = Array.from(new Set([...(primary.tags || []), ...(duplicate.tags || [])]));
  primary.notes = [primary.notes, duplicate.notes].filter(Boolean).join("\n\n");
  primary.totalChats += duplicate.totalChats || 0;
  primary.meta.pagesVisited = Array.from(new Set([...(primary.meta.pagesVisited || []), ...(duplicate.meta.pagesVisited || [])]));
  await primary.save();

  await Conversation.updateMany(
    { workspace: req.workspaceId, contact: duplicate._id },
    { $set: { contact: primary._id } }
  );

  await Visitor.updateMany(
    { workspace: req.workspaceId, contact: duplicate._id },
    { $set: { contact: primary._id } }
  );

  duplicate.mergedInto = primary._id;
  await duplicate.save();

  res.json({
    success: true,
    data: { primary }
  });
});

export const exportContactsCsv = asyncHandler(async (req, res) => {
  const contacts = await Contact.find({ workspace: req.workspaceId, mergedInto: null }).sort({ name: 1 });

  const csv = toCsv(
    contacts.map((contact) => ({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      tags: contact.tags.join("|"),
      totalChats: contact.totalChats,
      lastActive: contact.meta?.lastActive?.toISOString?.() || "",
      location: contact.meta?.location || ""
    }))
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="contacts.csv"');
  res.send(csv);
});
