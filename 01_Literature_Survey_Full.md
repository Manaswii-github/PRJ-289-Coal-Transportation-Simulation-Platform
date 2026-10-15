# Literature Survey: A Multimodal Visibility Platform for Coal Transportation

## 1. Introduction

I started this survey with a fairly simple question in mind: what does the research actually say about building a platform that gives everyone in the coal business a single real time view of where their coal is, how it is moving, and when it will arrive? The more I read, the more interesting the answer turned out to be.

Coal is still the backbone of electricity generation in India. It accounts for roughly 70 percent of the country's power, and Coal India Limited alone produces around 82 percent of domestic coal and dispatches hundreds of millions of tonnes every year [14]. Getting that coal from the pit head to a power plant is not a simple point to point move. It is a chain of stages. Coal leaves the mine by truck, conveyor, or a dedicated merry go round system. It then travels by rail rake, sometimes by barge on a river, sometimes by coastal ship, and finally by truck again from the siding or port to the plant's stockyard. Each of these stages is run by a different set of organizations, and each organization tends to track its own part in its own way, or often does not track it digitally at all.

This fragmentation is exactly the problem a multimodal visibility platform is meant to solve. There is no single source of truth anywhere in the chain that tells you where the coal is right now, which mode is carrying it, when it will reach the plant, and in what condition [3][14][15]. Everyone works with partial information, and decisions get made over phone calls and spreadsheets.

This survey pulls together the research that is relevant to building such a platform. I have organized it into nine areas: what supply chain visibility actually means, the state of the Indian coal supply chain, multimodal transport and arrival time prediction, real time visibility platforms, tracking technologies like GPS and RFID, digital twins, blockchain, inland waterways, and the rail freight information systems that already exist in India. Section 7 lists every source I used, with links, so everything can be verified.

## 2. How I Went About It

I searched for literature using web based academic sources, publisher portals like Springer, Elsevier, Taylor and Francis, PeerJ, Atlantis Press, IEEE, and official repositories of the Government of India and IIM Ahmedabad. The search terms I used included coal supply chain, multimodal transportation visibility, real time tracking, GPS and IoT and RFID freight tracking, intermodal ETA prediction, supply chain visibility, inland waterways India, rail freight information systems, digital twin logistics, and blockchain coal. I screened what came back for relevance, credibility of the venue, and recency, and kept sixteen sources. Eleven of those are peer reviewed research papers. The rest are official government reports and an industry publication, which I have marked clearly so nobody mistakes them for academic papers.

## 3. What the Literature Says, Theme by Theme

### 3.1 What Visibility Actually Means

The most cited definition of supply chain visibility comes from Barratt and Oke [2]. They describe it as the extent to which actors in a supply chain have access to, or share, information that they consider key or useful to their operations and of mutual benefit. What I like about their framing is the distinction they draw. Information sharing is the activity. Visibility is the capability that comes out of that activity. You can collect all the data in the world, but if partners do not trust it, if it arrives too late, or if nobody can act on it, you do not have visibility. You just have a database.

A later systematic review by Kalaiarasan and colleagues [1] went through 47 empirical studies and put together what they call the ABCDE framework. A for antecedents, meaning the things that need to be in place like trust, connectivity, and compatible IT systems. B and C for barriers and challenges, which are the things that hold visibility back. D for drivers, the motivations that push organizations toward sharing. E for effects, which they split into capabilities and performance outcomes. They also refined the definition of visibility itself, saying it is the extent to which actors have visual access to timely and accurate demand and supply information that is useful to their operations. The words that matter there are timely, accurate, and useful.

I am dwelling on this because these two papers are the theoretical anchor for the whole project. They tell you what visibility is supposed to be, and they tell you which factors decide whether it works or fails. Most of those factors are not technical at all. They are about trust and the willingness to share.

### 3.2 The Indian Coal Supply Chain and Its Pain Points

Ilahi's review of the Indian coal supply chain [14] is the most useful single source I found on the problem side. He covers the mode mix, which includes road, rail, merry go round systems, belt conveyors, ropeways, and the rail sea route, and then he catalogs the documented problems in detail.

On rail, the story is rough. Wagon turnaround times keep rising. Rakes are in short supply. Between March and May 2022, Indian Railways cancelled about 1,900 trains so that coal could move faster. Average goods train speeds are low, with targets of 30 km per hour by 2026 and 50 km per hour by 2051. Coal also sits only third in freight priority, behind food grains and emergency relief supplies. On road, roughly half of Coal India's dispatches move by truck, and that brings its own problems: accidents involving local people, dust pollution along the routes, and high fuel costs. His conclusion is blunt, and it matches my project almost word for word. He recommends an integrated platform that brings the ministries of rail, shipping, and roads together with real time data so that everyone gets a comprehensive 360 degree view for planning multimodal coal movement.

The Ministry of Coal's Draft National Coal Logistics Plan [15] quantifies the same story from the source side. In 2020 21, Coal India loaded 241.4 rakes per day against a target of 273.5. Wagon availability is a constant constraint. The plan projects wagon turnaround at around five days for FY23, improving to four days in FY24 and 3.5 days by FY27. It also explicitly says that IoT based coordination is needed for inbound and outbound moves, and that coal consumers care mainly about tracking their inbound quantities. That last point is basically the demand statement for a visibility platform.

For context, some numbers from industry reporting back this up. Indian Railways overprices coal freight by roughly 31 percent to cross subsidize passenger operations. About half of all rakes are used for coal. Nearly 60 million tonnes of coal sat stranded at mines during the 2022 shortage because rakes were not available. Coal India reports around six lakh truck movements every month. Analysts estimate rail coal capacity will need to roughly double, from about 660 million tonnes to 1,200 million tonnes a year, by 2030 [14][15]. None of this is peer reviewed research, so I keep it as context rather than citing it as a finding, but it does show the problem is real and large.

### 3.3 Multimodal Transport and Arrival Time Prediction

Once you decide to show where coal is, the natural next question is when it will arrive. Predicting arrival times in a multimodal journey is harder than it looks, because each leg has completely different delay behavior. A train runs on a schedule and a network. A truck depends on traffic, loading queues, and driver behavior. A barge depends on river depth and lock queues.

Balster and his co authors [5] built machine learning ETA models for intermodal freight networks, where cargo moves in the same container across several modes. Their design insight is simple and effective: instead of training one giant model, they train a separate model for each leg, using historical transport data plus external data. Road legs, rail legs, and terminal processing times each get their own model. The results were reliable enough that actors along the chain could proactively react to predicted delays instead of discovering them after the fact. This transfers directly to coal, because a coal journey has the same structure: siding to main line, main line to yard, yard to plant siding, with very different delay drivers at each step.

Wani [6] reviewed a decade of ETA research and distilled ten practical lessons. Fuse real time data with historical data. Model weather and traffic explicitly. Account for driver behavior. Give probabilistic estimates instead of single point guesses, because the real world is uncertain. Use reinforcement learning for adaptive routing. One number that stood out to me is that hybrid methods, which combine algorithmic intelligence with human heuristics, improve ETA accuracy by 15 to 20 percent. That is a strong argument for building ETA features carefully rather than just showing distance divided by speed.

Ouedraogo and colleagues [7] added another layer. Their system detects disruptions in real time during multimodal container transport by combining container tracking data with textual data, like operational messages, and processing both with natural language processing. Built together with Traxens, a company that makes real time container trackers, the system shows that positional data alone is not enough. You also need the text around it, the cancellation notice, the congestion alert, the exception message. For coal, the equivalent would be combining GPS tracks with messages like rake cancelled or port congested, and turning both into actionable alerts.

### 3.4 Real Time Visibility Platforms, Including the Paper That Is Basically This Project

The closest match to my project in the entire literature is a 2025 paper by Pandey, Tigga, Ali, and Rathore [3], titled Supply Chain Management for Multi Modal Visibility of Coal Transportation Using Real Time Data Visualization. They describe coal transportation as a complex network of trucks, trains, and ships where inefficiencies come from fragmented processes and lack of integration. Their proposal is a unified digital platform with real time GPS tracking, multimodal integration, centralized data visualization, and advanced analytics, along with an implementation framework covering data integration, optimization models, and dashboards. They even position it as the foundation for future blockchain and AI driven optimization of coal logistics. Finding this paper was genuinely reassuring, because it tells me the direction is sound and the concept is already considered valid in the research community.

There is also useful work on why such platforms succeed or fail. Wycislak [9] studied real time visibility platform deployment in a complex transportation network with heavy subcontracting. His findings are sobering. Logistics service providers use real time data to a very limited extent, usually just to track one shipment at a time, often by manually checking websites. End to end visibility fails when partners are not willing to share information, and that willingness is damaged when the risks, rewards, and benefits are distributed unevenly, or when privacy is a concern. Platform governance, meaning the rules about who gives what data and who benefits, turned out to be a decisive factor. I keep coming back to this paper because it is the voice of caution in a field otherwise full of optimism.

### 3.5 Tracking Technologies: GPS, IoT, and RFID

The sensing layer of any visibility platform is the part people usually worry about least, and the research says that is fair, because it is largely solved and cheap.

Jimoh and colleagues [13] built and field tested an IoT based GPS vehicle tracking system using a NEO 6M GPS module, a NodeMCU ESP8266 microcontroller, the Blynk cloud platform, and a SIM800L GSM module as a fallback when internet is unavailable. Field tests measured GPS accuracy at about 2.5 metres in urban areas and 4.8 metres in remote areas. For a coal truck rolling through semi rural mine belts, that is more than enough. The GSM fallback matters a lot in places with patchy coverage.

Sudhakaran and colleagues [12] combined RFID with IoT for railway tracking in Chennai's suburban rail system, using RFID readers to locate tagged objects in real time and IoT platforms for analytics, including DBSCAN clustering. It shows that RFID plus IoT is a mature pattern for identifying wagons and assets at sidings, weighbridges, and gates.

On the official side, the Ministry of Coal's Technology Roadmap for the Coal Sector already plans RFID enabled weighbridges, automatic boom barriers at mine entry and exit points, geo fencing of mine boundaries and coal patches, and CCTV at weighbridges. So the exact stack I would use for first mile tracking is already on the national roadmap. That is a strong practical argument for the platform: the sensors are coming anyway, someone just needs to wire their data together.

### 3.6 Digital Twins as the Upgrade Path

A visibility platform shows you what is happening. The natural next step is simulating what could happen, and that is where digital twins come in.

Maheshwari and colleagues [8] demonstrated a digital twin for real time planning, monitoring, and control of a food supply chain, combining mixed integer linear programming with agent based simulation. The twin kept a virtual model synchronized with physical operations and let managers run what if scenarios live. It achieved a 94 percent service level with better capacity utilization and shorter lead times. The food context is different from coal, but the mechanics transfer: first you see reality, then you simulate it, then you optimize it.

In practical terms, a digital twin for coal could answer questions like what happens to plant inventory if a rake cancellation cuts rail capacity by 15 percent, and should some volume be rerouted to barges or trucks. That kind of question is exactly what plant operators face during monsoon season or a coal crisis.

### 3.7 Blockchain for Transparency

Blockchain gets a lot of hype in supply chain discussions, so I was careful about how I treated it in this survey. The good news is that there is a paper that applies blockchain specifically to coal logistics.

Alam and colleagues [4] proposed a blockchain based coal supply chain management system for thermal power plants. Their system uses a decentralized immutable ledger for real time visibility, Solidity smart contracts to automate the workflow from coal request through approval, dispatch, transportation updates, and delivery, and cryptographic measures for data security. They validated the performance with Hyperledger Caliper. The problems they target are the same ones in my project: lack of transparency about coal origin, quality, and transportation status, errors from paper based documentation, and coordination failures among suppliers, transporters, and power plants.

That said, the visibility literature I reviewed in section 3.1 and the deployment evidence in section 3.4 both warn that technology alone cannot manufacture trust. If the incentives are unfair, partners will not share data regardless of the ledger. So my reading is that blockchain is useful selectively, for records where tamper proofing genuinely matters, like weighbridge slips, quality certificates, and delivery confirmations, while ordinary GPS pings should go through a fast pipeline instead of a blockchain.

### 3.8 Inland Waterways as the Underused Modal Option

One theme that kept surprising me was inland waterways. Barges are the cheapest and most fuel efficient way to move bulk cargo, and the most environmentally friendly, yet India uses them for less than half a percent of its freight, while the Netherlands moves about 48 percent of domestic freight by water. China is at 8.7 percent, the USA at 8.3 percent, Europe at 7 percent [10].

Gupta [10] studied why Indian shippers avoid inland waterway transport despite its advantages, and found it comes down to service requirements: reliability, lead time, cost, and convenience. The mode is cheap but shippers cannot trust the schedules, so they do not choose it. Raghuram's working paper from IIM Ahmedabad [11] assesses the viability of inland water transport in India, including bulk cargo cases that are directly relevant to coal.

The connection to my project is subtle but real. A visibility platform that tracks barges and gives reliable ETAs lowers exactly the reliability barrier that keeps shippers off the water. It also aligns with the National Coal Logistics Plan, which pushes coastal and inland shipping as part of the modal mix. So inland waterways are both an opportunity for the platform and a risk, because the service quality is still maturing.

### 3.9 The Existing Rail Backbone: FOIS

The last theme is the one that saves the project the most work. Indian Railways has run the Freight Operations Information System, FOIS, since the year 2000. Jain [16], who wrote about it as General Manager of FOIS at the Centre for Railway Information Systems, describes how it tracks wagons, locomotives, and unit trains in real time through two main modules, the Rake Management System and the Terminal Management System. It already exchanges data with the Control Office Application, the Logistics Data Bank of NICDC, and the Unified Logistics Interface Platform, ULIP, which is the government's single window for multimodal logistics visibility.

This matters enormously. It means a coal visibility platform does not need to build rail tracking from scratch. It can consume FOIS and ULIP data through APIs and focus its own sensing effort on the road, water, and terminal segments where no national system exists. That is both a cost saving and an integration credibility point that comes up in almost every discussion of this project.

## 4. Gaps I Found in the Literature

Putting all sixteen sources together, I see six gaps.

First, there is no deployed, end to end, coal specific visibility platform in the published literature. Pandey and colleagues [3] propose the concept, and Alam and colleagues [4] cover blockchain workflows, but neither is a working system covering mine gates, sidings, ports, and barges together.

Second, data standards are fragmented. Rail uses FOIS identifiers, transporters use their own TMS systems, ports use vessel systems, and nobody shares event semantics. Balster's per leg modeling [5] and the ULIP integration [16] point the way, but a unified coal data model does not exist yet.

Third, the organizational barriers are under modeled. Wycislak [9] shows that uneven benefits kill information sharing, and Kalaiarasan [1] lists barriers, but no coal study designs governance and incentive mechanisms into the platform itself.

Fourth, coal specific analytics are missing. The ETA research [5][6] and the risk detection work [7] are about containers and general freight. Nobody has built predictive models for rake cancellations, port congestion, weighbridge queues, and monsoon disruptions in the coal context.

Fifth, inland waterway visibility for coal is unexplored [10][11]. The economics of modal shift exist, but real time barge tracking for coal does not.

Sixth, nobody has quantified the impact. None of the papers link platform features to cost savings, emissions reduction, or wagon turnaround improvement for coal. That is an open contribution any project team could claim.

## 5. What the Platform Should Look Like

Based on the evidence, I would structure the platform in six layers.

The sensing layer uses GPS telematics on trucks and barges, RFID at gates, weighbridges, and sidings, and geo fencing around mines and routes. This is proven by the tracking literature [12][13] and already on the national roadmap.

The integration layer consumes FOIS and ULIP data for rail, and APIs or EDI for ports and transporters, then normalizes everything into standard events. Jain's description of FOIS [16] is the guide here.

The analytics layer applies per leg machine learning ETA models [5], probabilistic estimates [6], and combines positional data with text events for risk alerts [7].

The simulation layer adds a digital twin using the mixed integer linear programming and agent based simulation pattern [8], for what if questions about rerouting and modal shift.

The trust layer uses blockchain selectively for tamper proof records like weighbridge and quality data [4], with governance and benefit sharing designed in from day one [1][9].

The output layer is the control tower: dashboards, exception alerts, in transit stock levels for power plants, and modal shift advisories pointing to rail and water options [3][10][15].

## 6. Conclusion

The literature supports both the problem and the approach. The problem is real and quantified, with stranded stock, rake shortages, cancelled trains, and fragmented information all documented in official sources [14][15]. The approach is validated in adjacent domains: unified real time visibility platforms [3], per leg ETA models [5], data plus text risk detection [7], digital twins [8], and blockchain trust layers [4] have all been demonstrated working. The main documented risks are organizational rather than technical, since information sharing incentives and platform governance decide success [1][9]. A platform that combines the proven sensing stack, integrates with the existing rail backbone [16], applies per leg predictive analytics [5][6], and designs its governance from the start has a strong evidence based foundation and several clear open contributions, especially coal specific ETA, inland waterway integration, and quantified impact.

## 7. References

All references below were accessed and verified during preparation of this survey. Where a DOI exists, it is given.

1. Kalaiarasan, R., Olhager, J., Agrawal, T. K., and Wiktorsson, M. (2022). The ABCDE of supply chain visibility: A systematic literature review and framework. International Journal of Production Economics, 248, 108464. https://doi.org/10.1016/j.ijpe.2022.108464

2. Barratt, M., and Oke, A. (2007). Antecedents of supply chain visibility in retail supply chains: A resource based theory perspective. Journal of Operations Management, 25(6), 1217 1233. https://doi.org/10.1016/j.jom.2007.01.003

3. Pandey, A. K., Tigga, A., Ali, A., and Rathore, Y. K. (2025). Supply Chain Management for Multi Modal Visibility of Coal Transportation Using Real Time Data Visualization. Proceedings of the International Conference on Advances and Applications in Artificial Intelligence (ICAAAI 2025), Atlantis Press, pages 335 344. https://doi.org/10.2991/978-94-6463-738-0_28

4. Alam, M. I., Khatri, S., Shukla, D. K., Misra, N. K., Satpathy, S., and Hakimi, M. (2025). Blockchain based coal supply chain management system for thermal power plants. Discover Computing, 28, 61. https://doi.org/10.1007/s10791-025-09512-6

5. Balster, A., Hansen, O., Friedrich, H., and Ludwig, A. (2020). An ETA Prediction Model for Intermodal Transport Networks Based on Machine Learning. Business and Information Systems Engineering, 62(5), 403 416. https://doi.org/10.1007/s12599-020-00653-0

6. Wani, A. A. (2025). Ten quick tips for improving estimated time of arrival predictions using machine learning in logistics and transportation systems. PeerJ Computer Science, 11, e3259. https://doi.org/10.7717/peerj-cs.3259

7. Ouedraogo, C., Barlogis, R., Montarnal, A., Gourc, D., and Rosemont, C. (2025). Framework for real time multimodal container transport risk management. Engineering Applications of Artificial Intelligence, 165(A), 113108. https://doi.org/10.1016/j.engappai.2025.113108

8. Maheshwari, P., Kamble, S., Belhadi, A., Venkatesh, M., and Abedin, M. Z. (2023). Digital twin driven real time planning, monitoring, and controlling in food supply chains. Technological Forecasting and Social Change, 195, 122799. https://doi.org/10.1016/j.techfore.2023.122799

9. Wycislak, S. (2021). Real Time Visibility in a Transportation Network of a Complex Supply Chain. International Journal of Supply Chain Management, 10(3), 44 55. https://www.researchgate.net/publication/352976805

10. Gupta, A. (2017). Inland Waterways Transportation in India: Understanding and Meeting Shipper's Service Requirements. Journal of Commerce and Trade, 12(1), 1 10. https://doi.org/10.26703/jct.v12i1.115

11. Raghuram, G. (2006). Viability of Inland Water Transport in India. Indian Institute of Management Ahmedabad, Research and Publications. https://www.iima.ac.in/publication/viability-inland-water-transport-india

12. Sudhakaran, S., Maheswari, R., and Kanchana Devi, V. (2024). An improvised analysis of smart data for IoT based railway system using RFID. Automatika, 65(1), 361 372. https://doi.org/10.1080/00051144.2023.2295141

13. Jimoh, A. A., Abubakar, S. N., Oladuntoye, Q. O., and Mafe, A. S. (2025). Development and Implementation of Internet of Things Based Vehicle Tracking System. Journal of Engineering Research and Development, 9(5). https://doi.org/10.70382/bejerd.v9i5.013

14. Ilahi, F. (2024). Coal Supply chain in India: Challenges and Road Ahead. TIJER International Research Journal, paper TIJER2405206. https://tijer.org/tijer/papers/TIJER2405206.pdf

15. Ministry of Coal, Government of India (2022). Draft National Coal Logistics Plan. New Delhi. https://coal.gov.in/sites/default/files/2022-06/29-06-2022-Draft-National-Coal-Logistics-plan.pdf

16. Jain, A. K. (2022). Indian Railways' freight IT system: Towards a digitally integrated value chain. Global Railway Review. https://www.globalrailwayreview.com/article/131478/

Supporting context, not counted among the research papers: IEEFA analysis reported in The Hindu, December 2023, on Indian Railways coal capacity plans; Moneycontrol reporting, May 2022, on the coal and rake crisis; Ministry of Coal Technology Roadmap for the Coal Sector, December 2021; Vermont Agency of Transportation RFID final report, 2024.
