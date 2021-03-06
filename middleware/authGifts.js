import User from "../models/User.js";
import Person from "../models/Person.js";

export default async function (req, res, next) {
  const person = await Person.findById(req.params.id);

  if (!person) {
    return res.status(404).send({
      errors: [
        {
          status: "404",
          title: "Resource not found",
          description:
            "We cannot find the person with the given ID + " + req.params.id,
        },
      ],
    });
  }

  if (
    person.sharedWith.includes(req.user._id) ||
    person.owner == req.user._id
  ) {
    next();
  } else {
    return res.status(403).send({
      errors: [
        {
          status: "403",
          title: "Access forbidden",
          description: "Access restricted to a certain group of person.",
        },
      ],
    });
  }
}
