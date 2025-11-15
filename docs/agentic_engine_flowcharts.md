# Agentic Engine Flowcharts

This document contains beautiful flowcharts visualizing the agentic compliance auditing engine.

## 1. High-Level System Architecture

```mermaid
flowchart TB
    Start([Document Upload]) --> Extract[Document Extraction]
    Extract --> Chunk[Semantic Chunking]
    Chunk --> Embed[Generate Embeddings]
    Embed --> Index[Vector Store Indexing]
    
    Index --> Queue[Queue Audit]
    Queue --> Runner[Compliance Runner]
    
    Runner --> ProcessChunk{For Each Chunk}
    ProcessChunk --> BuildContext[Build RAG Context]
    BuildContext --> Analyze[LLM Analysis]
    Analyze --> Refine{Needs More Context?}
    Refine -->|Yes| BuildContext
    Refine -->|No| Flag[Generate Flag]
    Flag --> Store[Store Result]
    Store --> MoreChunks{More Chunks?}
    MoreChunks -->|Yes| ProcessChunk
    MoreChunks -->|No| Aggregate[Aggregate Results]
    
    Aggregate --> Report[Generate Report]
    Report --> Export[Export Markdown/PDF]
    Export --> End([Complete])
    
    style Start fill:#e1f5ff
    style End fill:#d4edda
    style Runner fill:#fff3cd
    style Analyze fill:#f8d7da
    style Report fill:#d1ecf1
```

## 2. Compliance Runner - Chunk Processing Flow

```mermaid
flowchart TD
    Start([Start Audit]) --> Init[Initialize Runner]
    Init --> GetChunks[Get Pending Chunks]
    GetChunks --> Check{Chunks Available?}
    Check -->|No| Complete([Audit Complete])
    Check -->|Yes| SelectChunk[Select Next Chunk]
    
    SelectChunk --> BuildContext[Build RAG Context]
    BuildContext --> ContextDetails[Context Details]
    
    ContextDetails --> ManualRAG[Retrieve Manual Neighbors]
    ContextDetails --> RegRAG[Retrieve Regulations]
    ContextDetails --> GuideRAG[Retrieve AMC/GM]
    ContextDetails --> EvidenceRAG{Include Evidence?}
    
    ManualRAG --> Combine[Combine Contexts]
    RegRAG --> Combine
    GuideRAG --> Combine
    EvidenceRAG -->|Yes| Combine
    EvidenceRAG -->|No| Combine
    
    Combine --> LLMAnalysis[LLM Analysis]
    LLMAnalysis --> Parse[Parse JSON Response]
    Parse --> CheckRefine{Needs Additional Context?}
    
    CheckRefine -->|Yes| RefineQuery[Extract Context Query]
    RefineQuery --> RefineRAG[Targeted RAG Search]
    RefineRAG --> LLMAnalysis
    
    CheckRefine -->|No| Score[Score & Flag]
    Score --> StoreResult[Store Chunk Result]
    StoreResult --> UpsertFlag[Upsert Flag]
    UpsertFlag --> UpdateProgress[Update Progress]
    UpdateProgress --> Commit[Commit to DB]
    Commit --> Delay[Rate Limit Delay]
    Delay --> More{More Chunks?}
    
    More -->|Yes| SelectChunk
    More -->|No| Finalize[Finalize Audit]
    Finalize --> RecordScore[Record Compliance Score]
    RecordScore --> Complete
    
    style Start fill:#e1f5ff
    style Complete fill:#d4edda
    style LLMAnalysis fill:#f8d7da
    style Score fill:#fff3cd
    style BuildContext fill:#d1ecf1
```

## 3. Recursive RAG Context Building

```mermaid
flowchart TB
    Start([Focus Chunk]) --> BaseRAG[Base RAG Context]
    BaseRAG --> ExtractRefs[Extract Section References]
    
    ExtractRefs --> RefQueue{Reference Queue}
    RefQueue -->|Empty| BaseContext[Base Context Ready]
    RefQueue -->|Has Refs| ProcessRef[Process Reference]
    
    ProcessRef --> CheckDepth{Depth < Max?}
    CheckDepth -->|No| SkipRef[Skip Reference]
    CheckDepth -->|Yes| RAGRef[RAG for Reference]
    
    RAGRef --> ExtractRefs2[Extract References from Result]
    ExtractRefs2 --> AddToQueue[Add to Queue]
    AddToQueue --> RefQueue
    
    SkipRef --> RefQueue
    
    BaseContext --> FindLitigation[Find Related Litigation]
    FindLitigation --> LitQueue{Litigation Queue}
    
    LitQueue -->|Empty| FinalContext[Final Context Bundle]
    LitQueue -->|Has Lit| ProcessLit[Process Litigation Chunk]
    
    ProcessLit --> RAGLit[RAG for Litigation]
    RAGLit --> ExtractLitRefs[Extract References]
    ExtractLitRefs --> AddLitToQueue[Add to Queue]
    AddLitToQueue --> LitQueue
    
    FinalContext --> ManualSlices[Manual Neighbors]
    FinalContext --> RegSlices[Regulation Slices]
    FinalContext --> GuideSlices[Guidance Slices]
    FinalContext --> EvidenceSlices[Evidence Slices]
    FinalContext --> RefSlices[Referenced Sections]
    FinalContext --> LitSlices[Litigation Slices]
    
    ManualSlices --> Bundle[Context Bundle]
    RegSlices --> Bundle
    GuideSlices --> Bundle
    EvidenceSlices --> Bundle
    RefSlices --> Bundle
    LitSlices --> Bundle
    
    Bundle --> TokenBudget[Apply Token Budget]
    TokenBudget --> Truncate{Exceeds Budget?}
    Truncate -->|Yes| Trim[Trim Low-Score Slices]
    Truncate -->|No| Ready[Context Ready]
    Trim --> Ready
    
    style Start fill:#e1f5ff
    style Ready fill:#d4edda
    style RAGRef fill:#fff3cd
    style RAGLit fill:#fff3cd
    style Bundle fill:#d1ecf1
```

## 4. Context Retrieval Process

```mermaid
flowchart LR
    Chunk[Focus Chunk] --> VectorSearch[Vector Search]
    
    VectorSearch --> ManualSearch[Manual Collection]
    VectorSearch --> RegSearch[Regulation Collection]
    VectorSearch --> GuideSearch[AMC/GM Collection]
    VectorSearch --> EvidenceSearch[Evidence Collection]
    
    ManualSearch --> ManualResults[Top-K Manual Neighbors]
    RegSearch --> RegResults[Top-K Regulations]
    GuideSearch --> GuideResults[Top-K Guidance]
    EvidenceSearch --> EvidenceResults[Top-K Evidence]
    
    ManualResults --> ContextSlice1[Context Slice]
    RegResults --> ContextSlice2[Context Slice]
    GuideResults --> ContextSlice3[Context Slice]
    EvidenceResults --> ContextSlice4[Context Slice]
    
    ContextSlice1 --> Bundle[Context Bundle]
    ContextSlice2 --> Bundle
    ContextSlice3 --> Bundle
    ContextSlice4 --> Bundle
    
    Bundle --> TokenCount[Calculate Tokens]
    TokenCount --> BudgetCheck{Within Budget?}
    BudgetCheck -->|No| SortByScore[Sort by Relevance Score]
    BudgetCheck -->|Yes| Ready[Ready for Analysis]
    
    SortByScore --> TrimLow[Trim Low-Score Slices]
    TrimLow --> Ready
    
    style Chunk fill:#e1f5ff
    style Ready fill:#d4edda
    style Bundle fill:#d1ecf1
    style VectorSearch fill:#fff3cd
```

## 5. LLM Analysis & Refinement Loop

```mermaid
flowchart TD
    Start([Chunk + Context Bundle]) --> BuildPrompt[Build Analysis Prompt]
    BuildPrompt --> LLMCall[Call OpenRouter LLM]
    
    LLMCall --> ParseJSON[Parse JSON Response]
    ParseJSON --> Validate{Valid JSON?}
    Validate -->|No| Retry[Retry with Error]
    Retry --> LLMCall
    
    Validate -->|Yes| ExtractFlag[Extract Flag & Findings]
    ExtractFlag --> CheckContext{needs_additional_context?}
    
    CheckContext -->|No| Finalize[Finalize Analysis]
    CheckContext -->|Yes| CheckAttempts{Attempts < Max?}
    
    CheckAttempts -->|No| Finalize
    CheckAttempts -->|Yes| ExtractQuery[Extract context_query]
    ExtractQuery --> CheckQuery{Query Provided?}
    
    CheckQuery -->|No| Finalize
    CheckQuery -->|Yes| RefineRAG[Refined RAG Search]
    
    RefineRAG --> ExpandContext[Expand Context Bundle]
    ExpandContext --> BuildPrompt
    
    Finalize --> Score[Calculate Severity Score]
    Score --> Citations[Extract Citations]
    Citations --> Recommendations[Generate Recommendations]
    Recommendations --> Result[Analysis Result]
    
    Result --> Store[Store in Database]
    Store --> End([Complete])
    
    style Start fill:#e1f5ff
    style End fill:#d4edda
    style LLMCall fill:#f8d7da
    style RefineRAG fill:#fff3cd
    style Result fill:#d1ecf1
```

## 6. Flag Generation & Synthesis

```mermaid
flowchart TD
    Analysis[Analysis Result] --> ExtractFlag[Extract Flag Color]
    ExtractFlag --> RED{Flag = RED?}
    ExtractFlag --> YELLOW{Flag = YELLOW?}
    ExtractFlag --> GREEN{Flag = GREEN?}
    
    RED -->|Yes| Critical[Critical Non-Conformity]
    YELLOW -->|Yes| Warning[Potential Issue]
    GREEN -->|Yes| Compliant[Compliant]
    
    Critical --> Severity[Calculate Severity Score]
    Warning --> Severity
    Compliant --> Severity
    
    Severity --> ExtractRefs[Extract Regulation References]
    ExtractRefs --> ExtractGaps[Extract Gaps]
    ExtractGaps --> ExtractRecs[Extract Recommendations]
    
    ExtractRecs --> CreateFlag[Create Flag Object]
    CreateFlag --> UpsertDB[Upsert to Database]
    
    UpsertDB --> CheckExisting{Flag Exists?}
    CheckExisting -->|Yes| Update[Update Existing Flag]
    CheckExisting -->|No| Insert[Insert New Flag]
    
    Update --> LinkChunk[Link to Chunk Result]
    Insert --> LinkChunk
    
    LinkChunk --> Aggregate[Aggregate Flags by Section]
    Aggregate --> End([Flag Stored])
    
    style Analysis fill:#e1f5ff
    style End fill:#d4edda
    style Critical fill:#f8d7da
    style Warning fill:#fff3cd
    style Compliant fill:#d4edda
    style UpsertDB fill:#d1ecf1
```

## 7. Document Processing Pipeline

```mermaid
flowchart TB
    Upload([Document Upload]) --> Validate[Validate File]
    Validate --> Extract[Extract Text]
    
    Extract --> Parse[Parse Structure]
    Parse --> Sections[Extract Sections]
    
    Sections --> Chunk[Semantic Chunking]
    Chunk --> ChunkObjects[Create Chunk Objects]
    
    ChunkObjects --> StoreChunks[Store in Database]
    StoreChunks --> EmbedQueue[Queue for Embedding]
    
    EmbedQueue --> GenerateEmbed[Generate Embeddings]
    GenerateEmbed --> VectorStore[Store in Vector DB]
    
    VectorStore --> CreateAudit{Create Audit?}
    CreateAudit -->|Yes| Audit[Create Audit Record]
    CreateAudit -->|No| Complete([Processing Complete])
    
    Audit --> QueueAudit[Queue Audit]
    QueueAudit --> Runner[Compliance Runner]
    Runner --> Complete
    
    style Upload fill:#e1f5ff
    style Complete fill:#d4edda
    style Chunk fill:#fff3cd
    style GenerateEmbed fill:#f8d7da
    style Runner fill:#d1ecf1
```

## 8. Complete End-to-End Flow

```mermaid
flowchart TB
    subgraph "Phase 1: Document Ingestion"
        A1[Upload Document] --> A2[Extract Text]
        A2 --> A3[Parse Structure]
        A3 --> A4[Chunk Document]
        A4 --> A5[Generate Embeddings]
        A5 --> A6[Index in Vector Store]
    end
    
    subgraph "Phase 2: Audit Execution"
        B1[Create Audit] --> B2[Queue Audit]
        B2 --> B3[Compliance Runner]
        B3 --> B4[For Each Chunk]
    end
    
    subgraph "Phase 3: Chunk Analysis"
        C1[Build RAG Context] --> C2[Recursive RAG]
        C2 --> C3[LLM Analysis]
        C3 --> C4{Needs Refinement?}
        C4 -->|Yes| C5[Refined RAG]
        C5 --> C3
        C4 -->|No| C6[Generate Flag]
    end
    
    subgraph "Phase 4: Result Aggregation"
        D1[Store Chunk Result] --> D2[Upsert Flag]
        D2 --> D3[Update Progress]
        D3 --> D4{More Chunks?}
        D4 -->|Yes| B4
        D4 -->|No| D5[Aggregate Results]
    end
    
    subgraph "Phase 5: Report Generation"
        E1[Calculate Statistics] --> E2[Generate Executive Summary]
        E2 --> E3[Generate Detailed Findings]
        E3 --> E4[Generate Recommendations]
        E4 --> E5[Export Report]
    end
    
    A6 --> B1
    B4 --> C1
    C6 --> D1
    D5 --> E1
    E5 --> F([Audit Complete])
    
    style A1 fill:#e1f5ff
    style F fill:#d4edda
    style C3 fill:#f8d7da
    style C6 fill:#fff3cd
    style E5 fill:#d1ecf1
```

## Component Interactions

```mermaid
graph TB
    subgraph "Core Services"
        Runner[ComplianceRunner]
        ContextBuilder[ContextBuilder]
        RecursiveBuilder[RecursiveContextBuilder]
        LLMClient[ComplianceLLMClient]
        FlagSynthesizer[FlagSynthesizer]
    end
    
    subgraph "Data Layer"
        DB[(SQLite Database)]
        VectorDB[(ChromaDB Vector Store)]
    end
    
    subgraph "Processing"
        DocProcessor[DocumentProcessor]
        Chunker[SemanticChunker]
        EmbeddingService[EmbeddingService]
    end
    
    DocProcessor --> Chunker
    DocProcessor --> EmbeddingService
    EmbeddingService --> VectorDB
    
    Runner --> ContextBuilder
    Runner --> RecursiveBuilder
    Runner --> LLMClient
    Runner --> FlagSynthesizer
    Runner --> DB
    
    ContextBuilder --> VectorDB
    ContextBuilder --> DB
    RecursiveBuilder --> ContextBuilder
    RecursiveBuilder --> VectorDB
    
    LLMClient --> OpenRouter[OpenRouter API]
    FlagSynthesizer --> DB
    
    style Runner fill:#fff3cd
    style LLMClient fill:#f8d7da
    style VectorDB fill:#d1ecf1
    style DB fill:#d1ecf1
```

## Legend

- 🔵 **Blue**: Start/End points
- 🟢 **Green**: Successful completion
- 🟡 **Yellow**: Processing/Transformation steps
- 🔴 **Red**: Critical operations (LLM calls, analysis)
- 🔷 **Light Blue**: Data storage/retrieval

---

*Generated for Junction25 AI Auditing System*

