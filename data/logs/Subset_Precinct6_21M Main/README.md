---
license: apache-2.0
task_categories:
  - text-classification
  - graph-ml
language:
  - en
tags:
  - cybersecurity
  - intrusion-detection
  - provenance-graphs
  - MITRE-ATT&CK
  - SOAR
  - security-operations
  - IDS
  - network-security
  - threat-detection
  - labeled-dataset
  - lead-rules
size_categories:
  - 1M<n<10M
configs:
  - config_name: signals
    data_files:
      - split: train
        path: signals/signals.parquet
  - config_name: graph_nodes
    data_files:
      - split: train
        path: graph/nodes.jsonl
  - config_name: graph_edges
    data_files:
      - split: train
        path: graph/edges.jsonl
  - config_name: incidents
    data_files:
      - split: train
        path: graph/incidents.jsonl
---

# WitFoo Precinct6 Cybersecurity Dataset

## Overview

A large-scale, labeled cybersecurity dataset derived from production Security Operations Center (SOC) data processed by [WitFoo Precinct](https://www.witfoo.com/) version 6.x. The dataset contains **2.1 million sanitized security events** (signal logs) and **provenance graphs** (13,119 incident graphs with 35,133 nodes and 634,190 edges) from real enterprise network monitoring across multiple organizations. Each incident has a natural-language threat-hunting report describing the attack chain, and per-incident GraphML files for direct loading in graph analysis tools.

**Available in two sizes:**
- [`witfoo/precinct6-cybersecurity`](https://huggingface.co/datasets/witfoo/precinct6-cybersecurity) — 2M signals (this dataset)
- [`witfoo/precinct6-cybersecurity-100m`](https://huggingface.co/datasets/witfoo/precinct6-cybersecurity-100m) — 114M signals (same methodology, larger extraction)

**Generate your own:** WitFoo Precinct 6.x customers can create datasets from their own data using the open-source pipeline: [`witfoo/dataset-from-precinct6`](https://github.com/witfoo/dataset-from-precinct6)

This dataset is designed to support research in:
- **Provenance graph-based intrusion detection** (KnowHow, NodLink, and similar systems)
- **AI-driven cyber defense simulation** (CybORG and MARL-based defense policy training)
- **Security alert classification** (malicious vs. suspicious vs. benign event labeling)
- **Attack lifecycle analysis** using MITRE ATT&CK framework mappings
- **Detection rule evaluation** using WitFoo's 261 lead detection rules

## Quick Start

```python
from datasets import load_dataset

# Load flat signal logs (2.07M rows, Parquet)
signals = load_dataset("witfoo/precinct6-cybersecurity", "signals", split="train")

# Find malicious events
malicious = signals.filter(lambda x: x["label_binary"] == "malicious")

# Find suspicious events (matched detection rules but not in confirmed incidents)
suspicious = signals.filter(lambda x: x["label_binary"] == "suspicious")

# Query by product/vendor
cisco_events = signals.filter(lambda x: x["vendor_name"] == "Cisco")

# Load provenance graph
nodes = load_dataset("witfoo/precinct6-cybersecurity", "graph_nodes", split="train")
edges = load_dataset("witfoo/precinct6-cybersecurity", "graph_edges", split="train")

# Load full incident graphs (10K incidents with embedded artifacts, leads, and MITRE mappings)
incidents = load_dataset("witfoo/precinct6-cybersecurity", "incidents", split="train")
```

**SQL queries (HuggingFace dataset viewer):**

```sql
-- Malicious events from confirmed incidents
SELECT * FROM signals WHERE label_binary='malicious' LIMIT 100;

-- Suspicious events that triggered detection rules
SELECT * FROM signals WHERE label_binary='suspicious' LIMIT 100;

-- Events with matched detection rules
SELECT matched_rules, set_roles, product_name FROM signals
WHERE matched_rules != '[]' LIMIT 100;

-- Count by label tier
SELECT label_binary, COUNT(*) FROM signals GROUP BY label_binary;
```

## Dataset Configurations

### `signals` — Flat Security Signal Logs

Tabular format ideal for ML classification, anomaly detection, and feature engineering. Each row is a sanitized security event from production network monitoring.

| Column | Type | Description |
|--------|------|-------------|
| `timestamp` | float | Unix epoch timestamp of the event |
| `message_type` | string | Event classification (e.g., `firewall_action`, `account_logon`, `security_audit_event`, `dns_event`, AWS API names) |
| `stream_name` | string | Source product/data stream identifier (see [Source Products](#source-products-stream-names)) |
| `pipeline` | string | Ingestion pipeline (`syslog`, `aws_cloudtrail`, etc.) |
| `src_ip` | string | Source IP address (sanitized) |
| `dst_ip` | string | Destination IP address (sanitized) |
| `src_port` | string | Source port |
| `dst_port` | string | Destination port |
| `protocol` | string | Network protocol (6=TCP, 17=UDP, 1=ICMP, etc.) |
| `src_host` | string | Source hostname (sanitized) |
| `dst_host` | string | Destination hostname (sanitized) |
| `username` | string | Associated username (sanitized) |
| `action` | string | Event action (`block`, `Logon`, `Logoff`, `File System`, etc.) |
| `severity` | string | Severity level (`warning`, `informational`, `Info`, etc.) |
| `vendor_code` | string | Vendor-specific event code (e.g., `ASA-4-106023` for Cisco) |
| `message_sanitized` | string | Full sanitized raw log message (syslog, XML, JSON, CSV depending on source) |
| `label_binary` | string | `malicious`, `suspicious`, or `benign` (see [Labeling](#labeling-methodology)) |
| `label_confidence` | float | Confidence score for the label (0.0–1.0). See [Scoring](#scoring). |
| `attack_techniques` | string | JSON array of MITRE ATT&CK technique IDs (e.g., `["T1041", "T1567"]`) |
| `attack_tactics` | string | JSON array of MITRE ATT&CK tactic IDs in `TA0001`-style (e.g., `["TA0009", "TA0010"]`) |
| `defense_techniques` | string | JSON array of MITRE D3FEND defense technique IDs |
| `mo_name` | string | Modus operandi / attack campaign type (e.g., `Data Theft`, `Phishing`) |
| `suspicion_score` | float | WitFoo-computed suspicion score (0.0–1.0). See [Scoring](#scoring). |
| `lifecycle_stage` | string | Kill chain stage (e.g., `initial-compromise`, `complete-mission`) |
| `disposition` | string | Raw Precinct status (`Disrupted`, `Investigating`, `Resolved`, `Dismissed`, `False Positive`, `Unprocessed`). See [Ground Truth](#ground-truth-and-disposition). |
| `disposition_category` | string | Bucketed disposition (`confirmed-malicious`, `false-positive`, `dismissed`, `automated`) |
| `is_false_positive` | bool | True if SOC analyst marked this incident as a false positive |
| `status_name` | string | Same as `disposition` (raw Precinct status); kept for clarity |
| `incident_ids` | string | JSON array of incident UUIDs referencing this artifact (empty for benign/suspicious) |
| `matched_rules` | string | JSON array of WitFoo lead rule descriptions that matched this event |
| `set_roles` | string | JSON array of WitFoo classification set roles (e.g., `Exploiting Host`, `C2 Server`) |
| `product_name` | string | Security product that generated this event (e.g., `ASA Firewall`, `Falcon`) |
| `vendor_name` | string | Vendor of the security product (e.g., `Cisco`, `Crowdstrike`) |

### `graph_nodes` — Provenance Graph Nodes

Nodes in the provenance graph representing network entities observed in security monitoring.

| Field | Type | Description |
|-------|------|-------------|
| `node_id` | string | Unique node identifier (sanitized IP, hostname, or UUID) |
| `type` | string | Entity type: `HOST`, `CREDENTIAL`, `SERVICE`, `FILE`, `CRED`, `ACTOR` |
| `attrs` | object | Node attributes: `ip` (sanitized), `hostname` (sanitized), `credential` (sanitized) |

### `graph_edges` — Provenance Graph Edges

Directed edges representing security events and relationships between entities.

| Field | Type | Description |
|-------|------|-------------|
| `edge_id` | string | Unique edge identifier |
| `src` | string | Source node ID |
| `dst` | string | Destination node ID |
| `type` | string | Edge type: `NETWORK_FLOW`, `AUDIT_EVENT`, `DNS_RESOLVE`, `INCIDENT_LINK`, `EVENT` |
| `timestamp` | float | Unix epoch timestamp |
| `attrs` | object | Edge attributes: `message_type`, `action`, `protocol`, `src_port`, `dst_port`, `stream` |
| `labels` | object | Labels: `label_binary`, `label_confidence`, `suspicion_score`, `attack_techniques`, `attack_tactics`, `mo_name`, `lifecycle_stage` |

### `incidents` — Full Incident Graphs

Complete incident records as produced by WitFoo Precinct's threat detection engine. Each incident is a self-contained provenance graph capturing a correlated chain of suspicious or malicious activity. This is the richest configuration — each record contains embedded nodes, edges, leads (the triggering artifacts with full raw messages), and framework mappings.

**Top-level fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique incident identifier |
| `name` | string | Auto-generated incident name (e.g., "Convoluted Bandicoot 241304") |
| `mo_id` | int | Modus operandi ID |
| `mo_name` | string | Attack campaign type: `Data Theft`, `Phishing` |
| `suspicion_score` | float | WitFoo-computed suspicion score (0.0–1.0) |
| `status_id` | int | Incident status code |
| `status_name` | string | Status: `Unprocessed`, `Investigating`, `Disrupted`, `Dismissed`, `False Positive` |
| `first_observed_at` | int | Unix timestamp of earliest event in the incident |
| `last_observed_at` | int | Unix timestamp of latest event in the incident |
| `created_at` | int | Unix timestamp when the incident was created |
| `lead_count` | int | Number of triggering signals (leads) |
| `nodes` | object | Dict of entity nodes in the incident graph |
| `edges` | object | Dict of connections between nodes |
| `leads` | object | Dict of triggering artifacts with full event data |
| `products` | object | Security products involved in detection |
| `tools` | object | Security tools that generated the signals |
| `sets` | list | WitFoo classification sets (Exploiting Host, Exploiting Target, etc.) |
| `actors` | list | Threat actor attributions (if any) |

**Incident leads** (`leads.{uuid}`):

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Lead UUID |
| `artifact` | object | Full artifact record (85+ fields) — the triggering security event |
| `details` | string | Sanitized raw log message that triggered the lead |
| `description` | string | Human-readable lead description |
| `set_id` | int | Classification set (1=Exploiting Host, 5=Exploiting Target, etc.) |
| `node_id` | string | Associated node UUID |
| `product` | object | Product that generated this lead, with framework mappings |
| `observed_at` | int | Unix timestamp of observation |

### Additional Files

- **`graph/graph.graphml`** — Full provenance graph in GraphML format (streaming write; ~477 MB)
- **`graph/graph.json`** — NetworkX node-link JSON format
- **`graph/incidents_graphml/{0-f}/{incident_id}.graphml`** — 13,119 per-incident GraphML files, sharded into 16 subdirectories by first hex char of the incident UUID (HuggingFace caps directories at 10,000 files). Each file is small (KB-MB) and loadable in Gephi, NetworkX, igraph, or DGL. Useful for graph-based research where loading the entire dataset is impractical. Total ~143 MB.
- **`graph/attack_reports.jsonl`** — Natural-language threat-hunting reports, one per incident. See [Attack Reports](#attack-reports).
- **`reference/lead_rules_catalog.json`** — Complete catalog of 261 WitFoo lead detection rules, 158 security products, 106 classification sets, and 216 stream-to-product mappings

## Data Provenance

### Production Origin

This dataset was generated from **production security operations data** collected by WitFoo Precinct 6.x, a Security Orchestration, Automation, and Response (SOAR) platform. The data originates from real enterprise networks monitored by WitFoo's SOC platform, covering 5 organizations across diverse industry sectors.

**Data collection period:** July–August 2024

**Processing pipeline:**
1. Security events were ingested by WitFoo Precinct 6.x from production network monitoring tools via syslog, API connectors, and agent-based collection
2. Events were parsed by WitFoo's signal processing pipeline using field extractors specific to each product/vendor
3. Events were correlated into incidents by WitFoo's automated threat detection and incident analysis engine using 261 lead detection rules
4. Incidents were scored with WitFoo's suspicion scoring algorithm and mapped to security frameworks (MITRE ATT&CK, D3FEND, NIST, CIS, PCI, etc.)
5. Raw signal data and incident graphs were extracted from WitFoo's Cassandra database
6. All data was sanitized through a comprehensive 4-layer PII removal pipeline (see [Sanitization](#sanitization-methodology))
7. Labels were derived from WitFoo's incident analysis and lead rule matching (see [Labeling](#labeling-methodology))

### Source Products (Stream Names)

The dataset contains security events from **158 security products** across **70+ vendors**, reflecting real enterprise SOC deployments. The complete product catalog is included in `reference/lead_rules_catalog.json`.

**Key products by category:**

| Category | Products |
|----------|----------|
| **Firewalls** | Cisco ASA, Palo Alto PAN NGFW, Fortinet FortiGate, Checkpoint, Meraki, SonicWall, pfSense, Barracuda CloudGen, Juniper SRX, OPNsense, VyOS |
| **Endpoint Protection** | CrowdStrike Falcon, Symantec SEP, Carbon Black, Cylance Protect, SentinelOne, Deep Instinct, Malwarebytes, ESET, Sophos Central, McAfee Endpoint |
| **Network Detection** | Cisco Stealthwatch, Cisco Firepower, Suricata IDS, TippingPoint IPS, Vectra Cognito, Cisco WSA |
| **Identity & Access** | Microsoft Windows AD, Cisco ISE, Centrify, CyberArk, Duo (Cisco), Okta, Shibboleth, Beyond Trust, Thycotic Secret Server |
| **Cloud Security** | AWS CloudTrail, AWS VPC Flow Logs, AWS GuardDuty, Azure Security, Zscaler NSS, Netskope, Cisco Umbrella |
| **Email Security** | ProofPoint Protect, Mimecast, FireEye EX, Barracuda ESS, Cisco IronPort, SpamTitan, Checkpoint Harmony Email |
| **Threat Intelligence** | FireEye NX/HX/AX/CMS, Trend Micro Deep Security, QRadar, Microsoft ATA, Cortex XDR |
| **Data Protection** | Symantec DLP, Varonis DatAdvantage, Imperva SecureSphere |
| **SOAR/SIEM** | WitFoo Precinct, Splunk, QRadar, Security Onion |
| **Infrastructure** | VMware vCenter/NSX, Elastic Filebeat, Linux (sshd, PAM, systemd, auditd, fail2ban), Apache, HAProxy |

**Stream names in the dataset** (top streams by volume):

| Stream Name | Product | Vendor | Description |
|-------------|---------|--------|-------------|
| `microsoft-windows-security-auditing` | Windows Active Directory | Microsoft | Logon/logoff, file access, privilege use, account management |
| `aws_cloudtrail_events` | AWS CloudTrail | Amazon Web Services | API calls: AssumeRole, Describe*, List*, Get*, 50+ event types |
| `aws_cloud_trail` | AWS CloudTrail | Amazon Web Services | CloudTrail via CloudWatch Logs |
| `vcenter` | VMware vCenter | VMware | Virtual infrastructure management events |
| `cisco_asa` | ASA Firewall | Cisco | Firewall allow/deny, connection teardown, VPN events |
| `cisco_os` | Cisco NOS | Cisco | Network device management and routing events |
| `cisco_stealthwatch` | Stealthwatch | Cisco | Network flow analytics and anomaly detection |
| `aws_vpc_flow_log` | AWS VPC Security | Amazon Web Services | Network flow data within AWS VPCs |
| `pan_firewall` | PAN NGFW | Palo Alto | Traffic allow/drop, threat events, URL filtering |
| `symantec_sep` | Symantec EP | Symantec | Endpoint security events |
| `meraki` | Meraki | Cisco | Cloud-managed network security events |
| `ad_audit_plus` | ADManager | ManageEngine | Active Directory audit and change tracking |
| `ad fs auditing` | Windows AD FS | Microsoft | Authentication and federation events |
| `network_communication` | Network Flow Data | Various | TCP/UDP/ICMP communication events |
| `sshd` | SSHD | Linux | SSH authentication and session events |
| `pam` | Linux PAM | Linux | Pluggable Authentication Module events |
| `crond` | cron | Linux | Scheduled task execution events |
| `linux_audit` | auditd | Linux | Linux kernel audit events |
| `dnsmasq` | dnsmasq | Linux | DNS resolver events |
| `barracuda_waf` | Barracuda WAF | Barracuda | Web application firewall events |
| `filebeat_diagnostic` | Filebeat | Elastic | Log shipper diagnostic events |
| `Crowdstrike Detection` | Falcon | CrowdStrike | Endpoint detection events |
| `DUO` | Duo | Cisco | Multi-factor authentication events |
| `proofpoint_protect` | Protect | ProofPoint | Email security events |

### WitFoo Precinct 6.x

WitFoo Precinct is a SOAR (Security Orchestration, Automation, and Response) platform that ingests security telemetry from diverse sources, parses events using vendor-specific field extractors, correlates events into incidents using automated threat detection rules, and maps findings to security frameworks.

- **Signal Processing:** Multi-stage pipeline with field extraction, normalization, and enrichment
- **Lead Detection Rules:** 261 rules that define what makes a security event suspicious enough to create an incident lead. Rules match on stream name, message type, action, severity, and vendor-specific event codes. Each rule assigns classification sets that define the role of source and target entities (e.g., Exploiting Host → Exploiting Target)
- **Incident Correlation:** Automated grouping of related signals into incident graphs with nodes (hosts, credentials, actors) and edges (connections, communications)
- **Framework Mapping:** Events and incidents are mapped to MITRE ATT&CK, MITRE D3FEND, NIST 800-53, NIST CSF, CIS Controls, PCI DSS, ISO 27001, SOC 2, and CMMC frameworks
- **Suspicion Scoring:** Proprietary scoring algorithm that assigns suspicion levels to nodes and incidents based on observed behavior patterns

### WitFoo Classification Sets

WitFoo classifies entities in incidents using 106 classification sets that define the role each entity plays in an attack. These are exposed in the `set_roles` column and in incident node data:

| Set ID | Name | Description |
|--------|------|-------------|
| 1 | Exploiting Host | Source of attack traffic |
| 2 | Staging Host | Host used for staging payloads or tools |
| 3 | Exfiltration Host | Source of data exfiltration |
| 4 | Suspicious User | User account involved in suspicious activity |
| 5 | Exploiting Target | Target of attack traffic |
| 6 | Staging Target | Target receiving staged payloads |
| 7 | Exfiltration Target | Destination of exfiltrated data |
| 8 | C2 Server | Command & Control infrastructure |
| 9 | Bot | Compromised host acting as bot |
| 10 | Malicious File | File identified as malicious |
| 11 | Reconnaissance Host | Source of scanning/recon activity |
| 12 | Reconnaissance Target | Target of scanning/recon |
| 13 | Disruption Host | Source of disruptive activity |
| 15 | Phishing Site | Phishing infrastructure |
| 16 | Phished User | User targeted by phishing |
| 18 | Ransomware Malware | Ransomware payload |
| 19 | Ransomware Target | Target of ransomware |
| 21 | Policy Violation User | User violating security policy |

## Labeling Methodology

### Three-Tier Labels (`malicious` / `suspicious` / `benign`)

Labels are derived from two sources: WitFoo Precinct's incident analysis and lead detection rule matching.

- **`malicious`**: The event was embedded as a lead (triggering artifact) inside one or more confirmed incidents. These events were identified by WitFoo's detection engine as part of attack patterns, correlated with other suspicious signals, and assigned to an incident with a suspicion score and modus operandi. The full artifact data, including raw messages, is extracted directly from the incident lead objects.

- **`suspicious`**: The event matched one or more of WitFoo's 261 lead detection rules (e.g., "ASA Deny", "Windows Failed Login Attempt", "Blocked Action", "CrowdStrike Detection") but did not appear in a confirmed incident. These events represent security-relevant activity flagged by detection logic.

- **`benign`**: The event did not match any lead detection rules and does not appear in any incident.

### Label Distribution

**2M Dataset (`witfoo/precinct6-cybersecurity`):**

| Label | Count | Percentage |
|-------|-------|------------|
| `benign` | 1,899,587 | 90.4% |
| `malicious` | 155,520 | 7.4% |
| `suspicious` | 45,256 | 2.2% |

Disposition breakdown for malicious records (raw `status_name`):

| Disposition | Count | Meaning |
|-------------|-------|---------|
| `Disrupted` | 86,760 | Analyst confirmed and intervened |
| `Unprocessed` | 68,740 | Automated detection, not yet reviewed |
| `Dismissed` | 20 | Analyst dismissed (low confidence) |

**114M Dataset (`witfoo/precinct6-cybersecurity-100m`):**

| Label | Count | Percentage |
|-------|-------|------------|
| `benign` | 113,326,050 | 99.34% |
| `malicious` | 125,780 | 0.11% |
| `suspicious` | 622,700 | 0.55% |

The imbalanced distribution reflects the reality of production SOC environments where the vast majority of events are benign, consistent with published IDS datasets (DARPA TC, LANL).

### Lead Detection Rules

The `matched_rules` column contains JSON arrays of rule descriptions matched for each event. The complete rule catalog is in `reference/lead_rules_catalog.json`. Example rules:

| Rule | Criteria | Source Role | Target Role |
|------|----------|-------------|-------------|
| Blocked Action | Any firewall block event | Exploiting Host | Exploiting Target |
| ASA Deny | `cisco_asa` + action="deny" | Exploiting Host | Exploiting Target |
| Windows Failed Login Attempt | Windows Event ID 4625 | Exploiting Target | Exploiting Host |
| CrowdStrike Detection | `Crowdstrike Detection` stream | Exploiting Target | Exploiting Host |
| AWS VPC Reject | `aws_vpc_flow_log` + action="REJECT" | Exploiting Host | Exploiting Target |
| Palo Alto FW Alarm | `pan_firewall` + severity < 5 | Exploiting Host | Exploiting Target |
| Authentication Failure | messageType="auth_failure" | Exploiting Host | Exploiting Target |
| The audit log was cleared | Windows Event ID 1102 | Exploiting Target | Exploiting Host |
| User Account Created | Windows Event ID 4720 | Exploiting Target | Exploiting Host |
| Special privileges assigned | Windows Event ID 4672 | Exploiting Target | Exploiting Host |

### Ground Truth and Disposition

**All labels in this dataset are derived from WitFoo Precinct's automated incident correlation engine — there is no independent, analyst-verified ground truth.** Researchers should treat Precinct's analysis as a strong but imperfect oracle. The `disposition` column lets you assess label quality on a per-record basis:

| `disposition` | Meaning | Confidence in label |
|---------------|---------|---------------------|
| `Disrupted` | SOC analyst confirmed the incident and intervened | High — human-confirmed malicious |
| `Investigating` | SOC analyst is actively investigating | Medium — analyst engaged |
| `Resolved` | SOC analyst confirmed and resolved | High — human-confirmed malicious |
| `Dismissed` | SOC analyst dismissed the incident | Negative — analyst rejected |
| `False Positive` | SOC analyst confirmed false positive | Negative — analyst rejected |
| `Unprocessed` | Automated detection, no human review | Lower — Precinct-confidence only |

The `disposition_category` column buckets these into four values for easier filtering: `confirmed-malicious`, `false-positive`, `dismissed`, `automated`. For experiments where ground-truth quality matters, restrict to records where `disposition` ∈ {`Disrupted`, `Resolved`} to compare against analyst-confirmed labels.

For benign and suspicious records, `disposition` is `Unprocessed` (no incident association). For malicious records, `disposition` reflects the parent incident's status at extraction time.

### Scoring

The dataset exposes two related score fields:

- **`suspicion_score`** (float, 0.0–1.0) — Precinct's proprietary suspicion score. Populated for malicious records from the parent incident; zero for benign and suspicious records. Range observed in this dataset: 0.25 to 0.98, mean 0.55.

- **`label_confidence`** (float, 0.0–1.0) — Confidence in the assigned `label_binary` tier. Computed deterministically from corroborating signal:

  | Label | Formula |
  |-------|---------|
  | `malicious` | `max(0.6, suspicion_score)` clamped to 0.95; lowered to 0.3 if `is_false_positive` |
  | `suspicious` | `0.4 + 0.1 × n_matched_rules + 0.05 × n_set_roles`, clamped to [0.5, 0.85] |
  | `benign` | `0.5` (no positive evidence either way) |

  Note: `label_confidence` is **not** the probability the activity is malicious — it indicates how much corroborating evidence supports the assigned tier. See `compute_label_confidence` in [`src/precinct6_dataset/label.py`](https://github.com/witfoo/dataset-from-precinct6/blob/main/src/precinct6_dataset/label.py).

### Attack Reports

The `graph/attack_reports.jsonl` file contains one natural-language threat-hunting report per incident (13,119 reports). Each report is deterministically composed from structured incident metadata (modus operandi, set roles, lead descriptions, MITRE mappings, timestamps) and explicitly documents that it **reflects Precinct's automated correlation engine output, not an independent threat-hunting investigation**.

Each record contains:

| Field | Description |
|-------|-------------|
| `incident_id` | Unique incident identifier (matches `incidents.jsonl`) |
| `report_text` | Multi-sentence narrative paragraph |
| `report_source` | Always `"template"` — sentences produced from a deterministic template |
| `mo_name` | Modus operandi |
| `suspicion_score`, `disposition`, `disposition_category` | Same as signal columns |
| `attack_techniques`, `attack_tactics` | MITRE ATT&CK mappings |
| `lead_count`, `node_count`, `edge_count` | Graph structure |
| `first_observed_at`, `last_observed_at` | Attack chain time bounds |
| `set_role_names` | WitFoo classification roles assigned |
| `matched_rules` | Detection rule descriptions that triggered |
| `products_observed` | Security products that detected activity |
| `lifecycle_stage` | Kill-chain stage |

Researchers can audit exactly how each sentence is derived by reading [`src/precinct6_dataset/attack_reports.py`](https://github.com/witfoo/dataset-from-precinct6/blob/main/src/precinct6_dataset/attack_reports.py).

### MITRE ATT&CK Mappings

Attack technique and tactic labels are derived from three sources, with deduplication:

1. **WitFoo set role names** attached to the incident (e.g., `C2 Server` → `TA0011` Command and Control, `T1071` Application Layer Protocol)
2. **Modus operandi** name on the incident (e.g., `Ransomware` → `TA0001`, `TA0002`, `TA0040`; `T1486` Data Encrypted for Impact)
3. **Per-product framework data** embedded in `incident.nodes.products.frameworks` (when present)

Tactic IDs use the standard MITRE ATT&CK Enterprise format (`TA0001` through `TA0043`). Technique IDs are top-level techniques (no sub-techniques) representing the most likely category for a given role. Researchers wanting precise per-event technique attribution should treat these as priors.

**Per-edge/per-node attribution in graph output:** `attack_tactics`, `attack_techniques`, `set_roles`, `lifecycle_stage`, `label_binary`, `label_confidence`, `suspicion_score`, `disposition` are attached at the **edge** level in both NDJSON and GraphML output. Nodes in `incidents.jsonl` carry their own `sets` and `products` dicts with per-entity information.

The full mapping tables are in [`src/precinct6_dataset/mitre_mapping.py`](https://github.com/witfoo/dataset-from-precinct6/blob/main/src/precinct6_dataset/mitre_mapping.py).

The `lifecycle_stage` field maps events to WitFoo's internal kill-chain model:

1. `initial-compromise` — Initial access to the network
2. `establish-foothold` — Execution and establishing persistence
3. `escalate-privilege` — Privilege escalation attempts
4. `internal-reconnaissance` — Discovery and internal scanning
5. `move-laterally` — Lateral movement between hosts
6. `maintain-persistence` — Command & control and persistence
7. `complete-mission` — Data theft, exfiltration, or impact
8. `policy-violation` — Policy violations (non-attack)

### Incident Modus Operandi

| MO Name | Incidents | Description |
|---------|-----------|-------------|
| Data Theft | 10,441 | Coordinated data exfiltration campaigns |
| Phishing | 1 | Phishing-based initial access |

## Sanitization Methodology

All customer-identifying information has been removed through a comprehensive, iterative four-layer sanitization pipeline. **Quality was prioritized over processing speed** — the dataset underwent multiple full re-sanitization cycles until convergence (near-zero new PII discoveries per cycle). The sanitization pipeline is [open source](https://github.com/witfoo/dataset-from-precinct6) under the Apache 2.0 license.

### Layer 1: Structured Field Sanitization with Multi-Pattern Sweep

Known data fields are sanitized based on their semantic meaning using deterministic replacement rules. IP addresses are replaced with reserved documentation ranges ([RFC 5737](https://datatracker.ietf.org/doc/html/rfc5737) for public IPs, HMAC-based remapping for private IPs that preserves subnet relationships). Hostnames, usernames, organization names, email addresses, Windows Security Identifiers, AWS account numbers, and credentials are each replaced with consistent sequential tokens (e.g., `HOST-0001`, `USER-0001`, `ORG-0001`). All replacements are consistent — the same original value always maps to the same sanitized token across every record, preserving network relationships and graph topology essential for security research.

After field-level sanitization, every record is swept using an [Aho-Corasick](https://en.wikipedia.org/wiki/Aho%E2%80%93Corasick_algorithm) multi-pattern matching automaton built from the full registry of over 300,000 known PII values. This catches PII that appears in unexpected contexts such as concatenated strings, cross-field references, and embedded data structures. Product identifiers (vendor names, event types, pipeline names) are explicitly protected from this sweep to preserve the security-relevant metadata researchers need.

| PII Category | Entries | Replacement Pattern |
|--------------|---------|---------------------|
| Public IPs | 88,917 | RFC 5737 TEST-NET (deterministic) |
| ARNs | 43,838 | `arn:aws:iam::NNNN:sanitized/NNNN` |
| AWS Account IDs | 31,460 | Sequential 12-digit IDs |
| Hostnames | 30,374 | `HOST-NNNN` |
| Private IPs | 24,509 | HMAC-remapped RFC 1918 (subnet-preserving) |
| Credentials | 23,859 | `CRED-NNNN` |
| Usernames | 23,188 | `USER-NNNN` |
| FQDNs | 17,234 | `host-NNNN.example.internal` |
| Organizations | 11,013 | `ORG-NNNN` |
| Emails | 3,723 | `user-NNNN@example.net` |
| Windows SIDs | 2,019 | Standardized replacement SIDs |
| Machine Accounts | 1,406 | `MACHINE-NNNN$` |
| Domains | 23 | `domain-NNNN.example.net` |
| Org IDs | 6 | Numeric replacement IDs |

### Layer 2: Format-Specific Log Message Parsing

Raw security log messages come in diverse vendor-specific formats. Eight specialized parsers handle the major formats: Cisco ASA syslog, Microsoft Windows Security Event XML, Elastic WinLogBeat JSON, AWS CloudTrail, Palo Alto Networks, VMware vCenter, DNS resolution logs, and a comprehensive generic fallback parser. Each parser understands the exact structure of its format and sanitizes PII within structured fields like XML elements, nested JSON objects, and CSV columns — contexts where simple pattern matching would be unreliable.

### Layer 3: Machine Learning Residual Detection

After rule-based sanitization, machine learning models scan a stratified random sample of sanitized records for residual PII that pattern-based approaches may miss. Two complementary models are used: [Microsoft Presidio](https://microsoft.github.io/presidio/) (powered by a spaCy natural language processing model) for entity recognition of persons, organizations, IP addresses, and email addresses; and a [BERT-based Named Entity Recognition model](https://huggingface.co/dslim/bert-base-NER) for an independent second opinion on person, organization, and location entities. New discoveries are added to the PII registry and trigger a full re-sanitization pass across all records.

### Layer 4: Large Language Model Contextual Review

A stratified random sample of sanitized records is reviewed by Anthropic's [Claude](https://www.anthropic.com/claude) for contextual PII detection. The model is prompted to identify subtle PII that statistical pattern matching and NER models commonly miss: organization names or abbreviations embedded in log messages, internal hostnames that reveal organizational structure, employee names in file paths or service descriptions, Active Directory group names, and geographic identifiers tied to specific offices or data centers. Findings trigger additional registry updates and re-sanitization.

### Iterative Convergence

The four layers run in iterative cycles. PII discovered by the ML and AI layers in one cycle is added to the pattern-matching registry, ensuring it is caught automatically by Layer 1 in all subsequent cycles across the complete dataset — not just in the sampled records. Cycles repeat until the ML and AI layers find near-zero new discoveries, indicating convergence.

### What Is Preserved

The sanitization preserves all security-relevant information needed for research:

- **Timestamps** — Event timing, dwell time, and lateral movement sequences
- **Port numbers** — Protocol behavior signals
- **Protocol types** — TCP/UDP/ICMP classification
- **Severity levels** — Event priority and criticality
- **Vendor event codes** — Cisco ASA codes, Windows Event IDs, AWS API names
- **Action types** — Block, permit, logon, logoff, file access
- **MITRE ATT&CK / D3FEND mappings** — Framework technique and tactic IDs
- **Graph topology** — Node relationships and connection patterns (via consistent IP/hostname replacement)
- **Product/stream identifiers** — Which security tool generated the event (explicitly protected from sanitization)
- **Lead rule match results** — Which detection rules matched each event

## Intended Uses

### Primary Use Cases

1. **Provenance graph-based intrusion detection research** — Evaluate and benchmark graph-based IDS approaches (KnowHow, NodLink) on production-derived data
2. **AI cyber defense simulation** — Train and evaluate reinforcement learning defense policies in CybORG and similar simulators
3. **Security alert classification** — Build and evaluate ML models for three-tier (malicious/suspicious/benign) event classification
4. **Attack lifecycle analysis** — Study attack progression patterns mapped to MITRE ATT&CK
5. **Detection rule evaluation** — Analyze effectiveness of 261 lead detection rules across diverse security products

### Research Context

This dataset was produced in collaboration with the University of Canterbury (New Zealand) Computer Science and Software Engineering department for two research projects:
- **AI Cyber-Security Battle Simulator** — Improving CybORG with realistic IDS observations, graph-based defense policies, and AI-driven attacker modeling
- **Intrusion Detection based on Provenance Graphs** — Evaluating reproducibility and generalizability of KnowHow and NodLink detection methods

## Limitations

- **Label imbalance**: Production SOC data is inherently imbalanced (~92–99% benign). Sampling strategies may be needed for balanced training.
- **Temporal scope**: Data covers July–August 2024, a limited time window
- **Organization diversity**: Data from 5 organizations, each with different security tool deployments
- **Sanitization trade-offs**: Some log message detail is reduced by PII replacement, particularly in free-text fields
- **Label derivation**: Labels depend on WitFoo's automated detection and 261 rules; some attacks may be unlabeled (false negatives) and some benign events may be incorrectly flagged
- **Incident coverage**: The same 10,442 incidents appear in both the 2M and 114M datasets since incidents are stored separately from signal data

## Ethical Considerations

- All customer-identifying information has been removed through the 4-layer sanitization process with ~302,000 PII mappings
- The dataset does not contain personally identifiable information (PII) of any individual
- IP addresses, hostnames, usernames, and organization names have been replaced with consistent synthetic tokens
- The dataset should be used for defensive security research only

## Citation

```bibtex
@dataset{witfoo_precinct6_2025,
  title={WitFoo Precinct6 Cybersecurity Dataset: Labeled Provenance Graphs and Signal Logs from Production SOC Operations},
  author={WitFoo, Inc.},
  year={2025},
  url={https://huggingface.co/datasets/witfoo/precinct6-cybersecurity},
  license={Apache-2.0}
}
```

## License

This dataset is released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
