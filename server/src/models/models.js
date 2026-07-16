export const ZoneSchemaDefinition = {
  zoneId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  currentCount: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['Normal', 'Warning', 'Danger'], default: 'Normal' },
  category: { type: String, default: 'Section' } // e.g. Gate, Concourse, Section, Restroom, FoodStall
};

export const CrowdAlertSchemaDefinition = {
  zoneId: { type: String, required: true },
  zoneName: { type: String },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
  rootCause: { type: String },
  suggestedAction: { type: String },
  fanAnnouncement: { type: String },
  timestamp: { type: Date, default: Date.now }
};

export const IncidentSchemaDefinition = {
  incidentText: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  teamsDispatched: { type: [String], default: [] },
  needsEscalation: { type: Boolean, default: false },
  suggestedResolution: { type: String },
  operatorAction: { type: String, enum: ['Pending', 'Accepted', 'Overridden'], default: 'Pending' },
  operatorNotes: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
};

export const VenueInfoSchemaDefinition = {
  type: { type: String, required: true, unique: true }, // e.g. 'schedule', 'gates', 'amenities', 'general'
  data: { type: Object, required: true }
};
