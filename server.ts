import express from 'express';
import path from 'path';
import multer from 'multer';
import xlsx from 'xlsx';
// @ts-ignore
import pdfParse from 'pdf-parse';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Standard middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy-initialize Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will fallback to offline mock mockups.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'MOCK_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Multer memory storage configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Mock projects for internal API tool simulation
const MOCK_PROJECTS = [
  {
    id: 'PAY-CORE',
    name: 'Fintech Secure Payment Gateway Core (Jira)',
    requirements: [
      {
        title: 'PAY-01: Cryptographic Protection',
        text: 'The system must encrypt all patient card numbers and transaction values using military-grade security standard encryption keys prior to writing them into the database.'
      },
      {
        title: 'PAY-02: Transaction Processing Speed',
        text: 'Credit card processing must be super fast and efficient so that users do not experience any delay.'
      },
      {
        title: 'PAY-03: Real-Time API Performance',
        text: 'The payment routing API must process transactions and return response codes in under 350ms under peak load.'
      },
      {
        title: 'PAY-04: Card Data Tokenization',
        text: 'The payment core application must process all credit card transactions securely by applying tokenization before storage.'
      },
      {
        title: 'PAY-05: System Crash Prevention',
        text: 'The financial transaction engine must never fail or experience any crashes during peak shopping events.'
      },
      {
        title: 'PAY-06: Immutable Transaction Ledgers',
        text: 'Every financial state transaction must be logged to an immutable ledger and signed with a unique audit ID.'
      },
      {
        title: 'PAY-07: Offline Data Direct Writes',
        text: 'To maximize offline processing speed, the system shall allow developers to make direct, unlogged edits to payment state database rows.'
      }
    ]
  },
  {
    id: 'HEALTH-PORT',
    name: 'Clinical Patient Medical Portal (Confluence Specs)',
    requirements: [
      {
        title: 'HLTH-01: Patient Health Logs UI',
        text: 'The patient workspace must render historical symptom logs beautifully, clearly, and instantly.'
      },
      {
        title: 'HLTH-02: HIPAA Compliance and Encryption',
        text: 'All patient health data and electronic medical records must comply with standard HIPAA regulations including full end-to-end data encryption.'
      },
      {
        title: 'HLTH-03: Absolute Record Protection',
        text: 'Under no circumstances should unauthorized users ever find a way to access medical records or health logs.'
      },
      {
        title: 'HLTH-04: Universal File Formats Support',
        text: 'The symptom log file uploader must parse and display diagnostic files formatted in any potential style instantly.'
      }
    ]
  },
  {
    id: 'GRID-EV',
    name: 'Smart EV Charger Grid Station Controller (REST Spec)',
    requirements: [
      {
        title: 'EV-01: Charger Load Balancing',
        text: 'The grid charging manager must distribute available local substation electrical power intelligently among all active chargers.'
      },
      {
        title: 'EV-02: Max Power Output Limit',
        text: 'The maximum power output delivered by any single residential charger node shall be restricted to a peak limit of 22 kW.'
      },
      {
        title: 'EV-03: Monitoring Telemetry Updates',
        text: 'Grid telemetry dashboard screens must display active charging power updates within 150ms of a state change.'
      },
      {
        title: 'EV-04: Peak Charging Safety Threshold',
        text: 'During standard state grid peak conditions, the maximum charging power delivery of any charger node must never exceed 11 kW.'
      }
    ]
  }
];

// Offline Fallback Analysis Generator (when no API key is set)
function generateOfflineAnalysis(title: string, text: string) {
  const containsVague = /fast|beautiful|clearly|instantly|efficient|super|military-grade|never|any/i.test(text);
  const isVerifiable = !/never|beautiful|clearly|instantly|efficient|super/i.test(text);
  
  const ambiguities = [];
  if (/fast/i.test(text)) {
    ambiguities.push({
      term: "fast",
      explanation: "Vague performance descriptor. What constitutes fast? (e.g. 100ms? 2 seconds?)",
      suggestions: ["Specify a maximum response time in milliseconds, e.g., < 200ms."]
    });
  }
  if (/beautiful|clearly|instantly/i.test(text)) {
    ambiguities.push({
      term: "instantly/clearly",
      explanation: "Subjective user interface qualifiers. Not testable.",
      suggestions: ["Define explicit rendering benchmarks (e.g., within 500ms) or point to a visual mockup wireframe."]
    });
  }
  if (/military-grade/i.test(text)) {
    ambiguities.push({
      term: "military-grade",
      explanation: "Marketing jargon. It lacks clear cryptographic specification.",
      suggestions: ["Replace with specific cipher specifications, e.g., AES-256 GCM encryption."]
    });
  }

  const suggestedImprovements = [];
  if (containsVague) {
    suggestedImprovements.push({
      original: text,
      suggested: text.replace(/fast/gi, "in less than 300ms").replace(/beautifully/gi, "according to Figma Wireframe Rev-3"),
      explanation: "Replaced subjective qualifiers with concrete, quantifiable limits."
    });
  } else {
    suggestedImprovements.push({
      original: text,
      suggested: `${text} and return a verified CRC checksum.`,
      explanation: "Added a verification loop to confirm complete receipt."
    });
  }

  const score = containsVague ? 55 : 88;

  return {
    classification: text.toLowerCase().includes('encrypt') || text.toLowerCase().includes('compliance') || text.toLowerCase().includes('security') ? 'Security' :
                    text.toLowerCase().includes('speed') || text.toLowerCase().includes('ms') || text.toLowerCase().includes('load') ? 'Performance' : 'Functional',
    score,
    scores: {
      clarity: containsVague ? 45 : 90,
      completeness: containsVague ? 50 : 85,
      feasibility: 90,
      testability: isVerifiable ? 95 : 40,
    },
    ambiguities,
    isVerifiable,
    nonVerifiableReason: isVerifiable ? undefined : "Contains unquantifiable quality attributes ('never', 'beautiful', 'instantly') which cannot be checked programmatically or validated uniformly.",
    missingAcceptanceCriteria: [
      "Given the system is under maximum load, when a request is submitted, then response should be processed within defined parameters.",
      "Verify system behavior when database connectivity drops out during processing."
    ],
    suggestedImprovements,
    decomposedStatements: [
      `${title} - Sub-requirement A: Atomic operation must be completed as requested.`,
      `${title} - Sub-requirement B: Logs must verify execution timestamp and result state.`
    ]
  };
}

// 1. API: Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.GEMINI_API_KEY });
});

// 2. API: Internal tool simulation
app.get('/api/internal-tool/projects', (req, res) => {
  res.json(MOCK_PROJECTS.map(p => ({ id: p.id, name: p.name, count: p.requirements.length })));
});

app.get('/api/internal-tool/projects/:id', (req, res) => {
  const proj = MOCK_PROJECTS.find(p => p.id === req.params.id);
  if (!proj) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(proj);
});

// 3. API: Parse requirements from file upload (PDF or Excel)
app.post('/api/parse-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const requirements: { title: string; text: string }[] = [];

    // Parse EXCEL Sheet
    if (mimetype.includes('spreadsheet') || mimetype.includes('excel') || originalname.endsWith('.xlsx') || originalname.endsWith('.xls')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      let index = 1;
      for (const row of rows) {
        if (!row || row.length === 0) continue;
        
        // Find cells with content
        const nonNullCells = row.map(cell => cell !== null && cell !== undefined ? String(cell).trim() : '').filter(Boolean);
        if (nonNullCells.length === 0) continue;

        // Skip headers if they look like metadata
        const fullRowText = nonNullCells.join(' | ');
        if (fullRowText.toLowerCase().includes('requirement text') || fullRowText.toLowerCase().includes('req description')) {
          continue;
        }

        if (nonNullCells.length === 1) {
          if (nonNullCells[0].length > 10) {
            requirements.push({
              title: `REQ-${String(index).padStart(3, '0')}`,
              text: nonNullCells[0]
            });
            index++;
          }
        } else {
          // Multiple columns: treat column 1 as title, column 2 as text (or vice versa)
          const potentialTitle = nonNullCells[0];
          const potentialText = nonNullCells.slice(1).join(' ');
          
          if (potentialText.length > 5) {
            requirements.push({
              title: potentialTitle.length < 50 ? potentialTitle : `REQ-${String(index).padStart(3, '0')}`,
              text: potentialText
            });
          } else {
            requirements.push({
              title: `REQ-${String(index).padStart(3, '0')}`,
              text: fullRowText
            });
          }
          index++;
        }
      }
    } 
    // Parse PDF Document
    else if (mimetype === 'application/pdf' || originalname.endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      const pdfText = data.text || '';

      if (pdfText.trim().length === 0) {
        throw new Error('PDF file has no readable text content.');
      }

      const hasKey = !!process.env.GEMINI_API_KEY;
      if (hasKey) {
        // Use Gemini to structure requirements from raw PDF text
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `You are an expert systems engineer. Parse the raw text extracted from a requirements specifications PDF document.
Extract all distinct software/system requirements or features. Produce a structured JSON list.

If the raw text is disjointed, consolidate sentences into readable, high-quality, discrete requirement items.
Generate at least 4-7 discrete requirements from the text.

Here is the extracted PDF text:
${pdfText.substring(0, 10000)}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "A unique identifier or short title, e.g. REQ-101 or User Logout" },
                  text: { type: Type.STRING, description: "The core requirement statement" }
                },
                required: ["title", "text"]
              }
            }
          }
        });

        const extracted = JSON.parse(response.text || '[]');
        requirements.push(...extracted);
      } else {
        // Offline parsing: split by lines/numbered blocks
        const lines = pdfText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 20);
        let idx = 1;
        for (const line of lines.slice(0, 15)) {
          requirements.push({
            title: `PDF-REQ-${String(idx).padStart(3, '0')}`,
            text: line
          });
          idx++;
        }
      }
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload Excel (.xlsx, .xls) or PDF (.pdf).' });
    }

    res.json({ requirements });
  } catch (error: any) {
    console.error('File parsing error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while parsing the file.' });
  }
});

// 4. API: Analyze Requirement
app.post('/api/analyze-requirement', async (req, res) => {
  const { title, text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Requirement text is required for analysis.' });
  }

  const hasKey = !!process.env.GEMINI_API_KEY;
  if (!hasKey) {
    // Generate simulated high-fidelity analysis
    const analysis = generateOfflineAnalysis(title || 'Requirement', text);
    return res.json({ analysis });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are an elite Requirements Quality Analyst and Systems Engineer.
Analyze this requirement:
Title: "${title || 'Requirement'}"
Requirement: "${text}"

Provide a comprehensive, high-quality engineering review. Perform:
1. Classification: Categorize it (Functional, Non-Functional, Security, Performance, UI/UX, or Other).
2. Quality Scoring: Give an overall score from 0-100 and a 0-100 breakdown for:
   - Clarity (how explicit/unambiguous is it)
   - Completeness (does it provide enough detail/parameters)
   - Feasibility (is it realistic with normal software platforms)
   - Testability (can it be scientifically verified or measured)
3. Ambiguity Detection: Check for vague terms (e.g. "fast", "flexible", "beautiful", "secure", "instantly", "real-time", "as appropriate"). List each, explain the issue, and provide explicit quantitative rewritings.
4. Verifiability Check: Decide if it is objectively verifiable. If false, specify the exact engineering reason.
5. Missing Acceptance Criteria: List concrete missing criteria in bullet points or Gherkin Given-When-Then format.
6. Suggested Improvements: Suggest a direct, high-quality, measurable alternative wording and explain why it is superior.
7. Decomposition: Decompose this requirement into smaller, atomic, testable statements.

Return the response in strict JSON format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: { type: Type.STRING },
            score: { type: Type.INTEGER },
            scores: {
              type: Type.OBJECT,
              properties: {
                clarity: { type: Type.INTEGER },
                completeness: { type: Type.INTEGER },
                feasibility: { type: Type.INTEGER },
                testability: { type: Type.INTEGER }
              },
              required: ["clarity", "completeness", "feasibility", "testability"]
            },
            ambiguities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  suggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["term", "explanation", "suggestions"]
              }
            },
            isVerifiable: { type: Type.BOOLEAN },
            nonVerifiableReason: { type: Type.STRING },
            missingAcceptanceCriteria: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedImprovements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  suggested: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["original", "suggested", "explanation"]
              }
            },
            decomposedStatements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            "classification",
            "score",
            "scores",
            "ambiguities",
            "isVerifiable",
            "missingAcceptanceCriteria",
            "suggestedImprovements",
            "decomposedStatements"
          ]
        }
      }
    });

    const parsedAnalysis = JSON.parse(response.text || '{}');
    res.json({ analysis: parsedAnalysis });
  } catch (error: any) {
    console.error('Gemini analysis error:', error);
    res.status(500).json({ error: error.message || 'Error occurred during requirements analysis.' });
  }
});

// 5. API: Batch analyze requirements for duplicates and conflicts
app.post('/api/batch-analyze', async (req, res) => {
  const { requirements } = req.body;
  if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
    return res.status(400).json({ error: 'Requirements array is required for scanning.' });
  }

  const hasKey = !!process.env.GEMINI_API_KEY;
  if (!hasKey) {
    // Return offline mock duplicate/conflict checks based on known mock data ID
    const duplicates = [];
    const conflicts = [];

    // Simple rule-based mock matching
    const reqTexts = requirements.map(r => ({ id: r.id, title: r.title, text: r.text }));
    
    // Check PAY-01 vs PAY-04
    const pay1 = reqTexts.find(r => r.title.includes('PAY-01') || r.text.includes('encrypt all patient card numbers'));
    const pay4 = reqTexts.find(r => r.title.includes('PAY-04') || r.text.includes('process all credit card transactions securely'));
    if (pay1 && pay4) {
      duplicates.push({
        req1Id: pay1.id,
        req1Title: pay1.title,
        req2Id: pay4.id,
        req2Title: pay4.title,
        similarity: 82,
        explanation: "Both requirements specify credit card security and transaction protection mechanisms, introducing a redundant overlap."
      });
    }

    // Check PAY-06 vs PAY-07 (Conflict)
    const pay6 = reqTexts.find(r => r.title.includes('PAY-06') || r.text.includes('immutable ledger'));
    const pay7 = reqTexts.find(r => r.title.includes('PAY-07') || r.text.includes('direct, unlogged edits'));
    if (pay6 && pay7) {
      conflicts.push({
        req1Id: pay6.id,
        req1Title: pay6.title,
        req2Id: pay7.id,
        req2Title: pay7.title,
        explanation: "PAY-06 mandates an immutable ledger and signed audit trail for every transaction, whereas PAY-07 explicitly allows unlogged, direct database modifications, which completely bypasses auditing.",
        severity: "High" as const
      });
    }

    // Check EV-02 vs EV-04 (Conflict)
    const ev2 = reqTexts.find(r => r.title.includes('EV-02') || r.text.includes('residential charger node shall be restricted to a peak limit of 22 kW'));
    const ev4 = reqTexts.find(r => r.title.includes('EV-04') || r.text.includes('never exceed 11 kW'));
    if (ev2 && ev4) {
      conflicts.push({
        req1Id: ev2.id,
        req1Title: ev2.title,
        req2Id: ev4.id,
        req2Title: ev4.title,
        explanation: "EV-02 allows up to 22 kW of single charger capacity, whereas EV-04 restricts charging strictly to 11 kW during peak times. These thresholds require hierarchical load-management rules rather than static limits.",
        severity: "Medium" as const
      });
    }

    return res.json({ result: { duplicates, conflicts } });
  }

  try {
    const ai = getGeminiClient();
    
    // Build list string
    const listString = requirements.map((r, i) => `[Index: ${i} | ID: ${r.id}] Title: ${r.title}\nStatement: ${r.text}`).join('\n\n');

    const prompt = `You are a Lead Systems Analyst. You are given a list of software requirements.
Your job is to identify:
1. Duplicates or significant logical overlaps (similarity > 65%).
2. Conflicts or direct contradictions (e.g. mismatched limits, auditing bypasses, contradictory user actions, opposing security settings).

Here is the list of requirements:
${listString}

Analyze them and return a JSON list of duplicates and conflicts, matching the IDs provided in the input. Ensure "severity" of conflicts is either "High", "Medium", or "Low".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            duplicates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  req1Id: { type: Type.STRING },
                  req1Title: { type: Type.STRING },
                  req2Id: { type: Type.STRING },
                  req2Title: { type: Type.STRING },
                  similarity: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ["req1Id", "req1Title", "req2Id", "req2Title", "similarity", "explanation"]
              }
            },
            conflicts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  req1Id: { type: Type.STRING },
                  req1Title: { type: Type.STRING },
                  req2Id: { type: Type.STRING },
                  req2Title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  severity: { type: Type.STRING, description: "Must be High, Medium, or Low" }
                },
                required: ["req1Id", "req1Title", "req2Id", "req2Title", "explanation", "severity"]
              }
            }
          },
          required: ["duplicates", "conflicts"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"duplicates": [], "conflicts": []}');
    res.json({ result });
  } catch (error: any) {
    console.error('Gemini batch scan error:', error);
    res.status(500).json({ error: error.message || 'Error occurred during requirements scanning.' });
  }
});

// 6. API: Generate testable requirements from prompt/concept
app.post('/api/generate-requirements', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'A concept prompt or description is required.' });
  }

  const hasKey = !!process.env.GEMINI_API_KEY;
  if (!hasKey) {
    // Generate a high-fidelity mock requirement set
    const mockGenerated = [
      {
        title: "SEC-001: Data Encryption",
        text: `The application shall encrypt all confidential transmission payloads using TLS 1.3 cryptographic secure connections.`
      },
      {
        title: "AUTH-002: Multi-Factor Authentication",
        text: `The authentication module must enforce secondary verification code delivery via SMS or TOTP authenticator app for any administration logins.`
      },
      {
        title: "PERF-003: Core Latency Benchmark",
        text: `All read query API endpoints must deliver data packets in less than 200ms when subjected to standard 10,000 concurrent active requests.`
      },
      {
        title: "AUDT-004: Event Logging Pipeline",
        text: `The audit system must log user ID, timestamp, resource access path, and client IP address in JSON format within 1 second of event trigger.`
      }
    ];
    return res.json({ requirements: mockGenerated });
  }

  try {
    const ai = getGeminiClient();
    const systemPrompt = `You are a Senior Principal Architect. Generate 4 to 6 high-quality, testable, fully formed requirements for: "${prompt}".
Each requirement should feature a professional, specific title and a concrete requirement statement. 
Avoid vague descriptors; specify explicit numeric limits, constraints, and conditions to make them perfectly testable and verifiable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Concise identifier or name, e.g. AUTH-01 or Payment Processing Limit" },
              text: { type: Type.STRING, description: "Atomic, testable requirement statement" }
            },
            required: ["title", "text"]
          }
        }
      }
    });

    const generated = JSON.parse(response.text || '[]');
    res.json({ requirements: generated });
  } catch (error: any) {
    console.error('Gemini requirements generation error:', error);
    res.status(500).json({ error: error.message || 'Error occurred during requirements generation.' });
  }
});

// Serve frontend with Vite middleware in development, or serve built assets in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Requirements Intelligence] Backend active at http://0.0.0.0:${PORT}`);
  });
}

startServer();
