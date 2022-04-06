import createDebug from "debug";
import sanitizeBody from "../middleware/sanitizeBody.js";
import Course from "../models/Course.js";
import express from "express";
import authUser from "../middleware/auth.js";
import authAdmin from "../middleware/authAdmin.js";

const debug = createDebug("mad9124-w21-a3-jwt-auth");
const router = express.Router();

router.use("/", authUser, sanitizeBody);
router.get("/", async (req, res) => {
  let courses = await Course.find();
  res.send({ data: formatResponseData(courses) });
});

// Course POST route.
router.post("/", authAdmin, (req, res, next) => {
  new Course(req.sanitizedBody)
    .save()
    .then((newCourse) => res.status(201).json(formatResponseData(newCourse)))
    .catch(next);
});

router.get("/:id", authUser, async (req, res) => {
  try {
    const document = await Course.findById(req.params.id);
    if (!document) throw new Error("resource not found");
    res.json({ data: formatResponseData(document) });
  } catch (err) {
    sendResourceNotFound(req, res);
  }
});

// ------------------------------------

const update =
  (overwrite = false) =>
  async (req, res) => {
    try {
      const document = await Course.findByIdAndUpdate(
        req.params.id,
        req.sanitizedBody,
        {
          new: true,
          overwrite,
          runValidators: true,
        }
      );
      if (!document) throw new Error("Resource not found");
      res.send({ data: formatResponseData(document) });
    } catch (err) {
      sendResourceNotFound(req, res);
    }
  };

router.put(
  "/:id",
  authAdmin,
  update(true),
  router.patch("/:id", authAdmin, update(false)),
  router.delete("/:id", authAdmin, async (req, res) => {
    try {
      const document = await Course.findByIdAndDelete(req.params.id);
      if (!document) throw new Error("resource not found");
      res.send({ data: formatResponseData(document) });
    } catch (err) {
      sendResourceNotFound(req, res);
    }
  })
);

/**
 * Format the response data object according to JSON:API v1.0
 * @param {string} type The resource collection name, e.g. ‘cars’
 * @param {Object | Object[]} payload An array or instance object from that collection
 * @returns
 */

function formatResponseData(payload, type = "course") {
  if (payload instanceof Array) {
    return payload.map((resource) => format(resource));
  } else {
    return format(payload);
  }

  function format(resource) {
    const { _id, ...attributes } = resource.toObject();
    return { type, id: _id, attributes };
  }
}

function sendResourceNotFound(req, res) {
  res.status(404).json({
    errors: [
      {
        status: "404",
        title: "Resource not found",
        description: `We could not find a course with id: ${req.params.id}`,
      },
    ],
  });
}

export default router;