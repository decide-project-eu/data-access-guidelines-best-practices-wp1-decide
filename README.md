# data-access-guidelines-best-practices-wp1-decide
This repository documents and compares three data access approaches—Direct, Centralized, and Decentralized (Solid Pods)—evaluated within the DECIDE project (WP1, Task 1.3). It includes practical guidelines, experimental benchmarks, Jupyter notebooks, and best practices for FAIR- and GDPR-aligned data sharing in veterinary surveillance systems.


### Tools and Technologies Used

#### Centraliz federated accessed Setup
- Data Cleaning & Transformation*: R scripts for each lab (customized mappings and filte
- Data Format: after cleaning RDF triples aligned with the Livestock Health Ontology (LHO)rs)
- Automation Pipeline: Quarto + GitHub Actions for scheduled processing
- Visualization: Tableau dashboards
- Repository: [GitHub – Cattle Barometer](https://github.com/decide-project-eu/cattle-use-case-barometer)
- Tutorial: [DECIDE Cattle Barometer Guide](https://decide-project-eu.github.io/case-studies-website/tutorials/cattle-barometer.html )

#### Dec fedrated accessentralized Setup (Solid Pods)
- Data Format: RDF triples aligned with the Livestock Health Ontology (LHO)
- Pod Hosting: [Solid Pod deployment](https://solidserver.bovi-analytics.com)
- SPARQL Query Engine: Comunica engine
- Federated API Deployment: [Azure Function Endpoint](https://decide-federated-functions.azurewebsites.net/api/FedQuery)
- Decentralized Fedrated query and  access control policiesata Upload Tool: [PENNY RDF uploader](https://github.com/djsf-kobayashi/penny)
- Visualization: Tableau (fed with real-time query results)
- Ontology: [Livestock Health Ontology on GitHub](https://github.com/decide-project-eu/LivestockHealthOntology)

