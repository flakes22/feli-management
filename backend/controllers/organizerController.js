import Event from "../models/Event.js";

// Create Event Draft
export const createEvent = async (req, res) => {
    try {
      const organizerId = req.user.id;
  
      const event = await Event.create({
        ...req.body,
        organizerId,
        status: "DRAFT",
      });
  
      res.status(201).json({
        message: "Event created in Draft mode",
        event,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// Publish Event
export const publishEvent= async(req,res)=>{
    try{
        const{id}=req.params;
        const event= await Event.findById(id);
        if(!event){
            return res.status(404).json({message: "Event not found"});
        }
        if(event.organizerId.toString()!==req.user.id){
            return res.status(403).json({message: "This is not your event"});
        }
        if(event.status!=="DRAFT"){
            return res.status(400).json({
                message:"Only draft events can be published.",
            });
        }
        event.status="PUBLISHED";
        await event.save();

        res.json({message: "Event published successfully"});
    }
    catch(error){
        res.status(500).json({ message: error.message });
    }
};

// Edit Event
export const editEvent = async (req, res) => {
    try {
      const { id } = req.params;
  
      const event = await Event.findById(id);
  
      if (!event)
        return res.status(404).json({ message: "Event not found" });
  
      if (event.organizerId.toString() !== req.user.id)
        return res.status(403).json({ message: "Not your event" });
  
      // Draft → full edit
      if (event.status === "DRAFT") {
        Object.assign(event, req.body);
      }
  
      // Published → limited edit
      else if (event.status === "PUBLISHED") {
        const allowedFields = [
          "description",
          "registrationDeadline",
          "registrationLimit",
        ];
  
        allowedFields.forEach((field) => {
          if (req.body[field] !== undefined) {
            event[field] = req.body[field];
          }
        });
      }
  
      // Ongoing/Closed → locked
      else {
        return res.status(400).json({
          message: "Event cannot be edited at this stage",
        });
      }
  
      await event.save();
  
      res.json({ message: "Event updated successfully", event });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// Get My events

export const getMyEvents = async (req, res) => {
    try {
      const events = await Event.find({
        organizerId: req.user.id,
      });
  
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
    