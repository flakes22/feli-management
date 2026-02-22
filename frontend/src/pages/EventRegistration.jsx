import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../utils/axios"; // your configured axios instance

const EventRegistration = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [formResponses, setFormResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchRegistrationForm = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `/participant/events/${eventId}/registration-form`
        );
        setEvent(data.event);

        // ✅ KEY FIX: use customForm fields from the event
        let fields =
          data.event?.customForm?.fields?.filter((f) => f.enabled !== false) || [];

        // Ensure _id exists since backend might only send id
        fields = fields.map(f => ({ ...f, _id: f._id || f.id }));
        setFormFields(fields);

        // Initialize empty responses
        const initialResponses = {};
        fields.forEach((field) => {
          if (field.type === "checkbox") {
            initialResponses[field._id] = [];
          } else {
            initialResponses[field._id] = "";
          }
        });
        setFormResponses(initialResponses);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load registration form");
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrationForm();
  }, [eventId]);

  const handleChange = (fieldId, value, type) => {
    if (type === "checkbox") {
      setFormResponses((prev) => {
        const existing = prev[fieldId] || [];
        const updated = existing.includes(value)
          ? existing.filter((v) => v !== value)
          : [...existing, value];
        return { ...prev, [fieldId]: updated };
      });
    } else {
      setFormResponses((prev) => ({ ...prev, [fieldId]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Build responses array
    const responses = formFields.map((field) => ({
      fieldId: field._id,
      label: field.label,
      value: formResponses[field._id],
    }));

    try {
      await axios.post(`/participant/events/${eventId}/register`, {
        formResponses: responses,
      });
      setSuccess("Successfully registered for the event!");
      setTimeout(() => navigate("/participant/events"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case "text":
      case "email":
      case "number":
        return (
          <input
            type={field.type}
            className="w-full border rounded px-3 py-2"
            placeholder={field.placeholder || ""}
            value={formResponses[field._id] || ""}
            required={field.required}
            onChange={(e) => handleChange(field._id, e.target.value, field.type)}
          />
        );

      case "textarea":
        return (
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder={field.placeholder || ""}
            value={formResponses[field._id] || ""}
            required={field.required}
            onChange={(e) => handleChange(field._id, e.target.value, field.type)}
          />
        );

      case "dropdown":
      case "select":
        return (
          <select
            className="w-full border rounded px-3 py-2"
            value={formResponses[field._id] || ""}
            required={field.required}
            onChange={(e) => handleChange(field._id, e.target.value, field.type)}
          >
            <option value="">-- Select --</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <div className="flex flex-col gap-1">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(formResponses[field._id] || []).includes(opt)}
                  onChange={() => handleChange(field._id, opt, "checkbox")}
                />
                {opt}
              </label>
            ))}
          </div>
        );

      case "radio":
        return (
          <div className="flex flex-col gap-1">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field._id}
                  value={opt}
                  checked={formResponses[field._id] === opt}
                  onChange={(e) => handleChange(field._id, e.target.value, field.type)}
                />
                {opt}
              </label>
            ))}
          </div>
        );

      case "file":
        return (
          <input
            type="file"
            className="w-full border rounded px-3 py-2"
            required={field.required}
            onChange={(e) =>
              handleChange(field._id, e.target.files[0]?.name || "", field.type)
            }
          />
        );

      default:
        return (
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formResponses[field._id] || ""}
            required={field.required}
            onChange={(e) => handleChange(field._id, e.target.value, field.type)}
          />
        );
    }
  };

  if (loading) return <div className="p-6">Loading registration form...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{event?.title}</h1>
      <p className="text-gray-500 mb-6">{event?.description}</p>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {formFields.length === 0 ? (
          <p className="text-gray-400 italic">No additional details required.</p>
        ) : (
          formFields.map((field) => (
            <div key={field._id} className="flex flex-col gap-1">
              <label className="font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.description && (
                <p className="text-sm text-gray-400">{field.description}</p>
              )}
              {renderField(field)}
            </div>
          ))
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default EventRegistration;