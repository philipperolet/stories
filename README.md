# Stories - Customer Journey Simulator
Interactive multistep adaptative marketing campaign simulator. 

Use it on https://stories.filou.tech

# How to use the simulator
The campaign will target 10 million people assumed to be a somewhat homogenous audience. The goal is to design the best campaign. At start there is an empty canvas.

- Click on "Create step" (bottom left) for the 1st step of the campaign;
- Choose the channel you wish to use (display, video, sms, email), and the kind of message (brand image or promotion);
- 3 branches will unfold, each representing a particular reaction from part of the audience: negative, engagement, conversion;
- for negative or engagement branches, new steps can (optionnally) be created;
- when the campaign is fully designed, click  "Launch campaign" to compute how well it would perform;
- each channel has its own cost and performance (conditional to the previous message seen by customers, how they reacted, etc.) and the simulation takes that into account;
- after checking the results (i.e. the campaign KPIs), click "Retry" to improve manually the campaign, or "2nd wave" to have a (toy) AI algo learn an optimized journey starting from your design;
- the learning time of the AI will be impacted by how efficient the initial manual campaign was;

Click "Informations" on the right to get detailed info about campaign performance indicators, channels, messages, etc.

# About
This app was created to illustrate multi-step adaptative marketing campaigns:

- **multistep** because customers will be shown various messages (or not) via retargeting abilities
- **adaptative** because the customer journey should change according to how the user react : different kinds of messages and channels should be used.

A second objective was to show that given the complexity of the task, automated algorithms were potentially able to optimize the gains. 

A third objective was to suggest the best performing campaign would be first created by humans, then optimized by A.I. -- since running AI from the start takes a long learning time.

## AI algorithm
The AI simulation is just classical dynamic programming based on action values estimated by experts. It is 

# Code / development
To check out/change the code, install and use locally by cloning the repo and serving it as static files using any web server.
