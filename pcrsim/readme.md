

These are the steps of the original PCR simulation:

* Use BLAST to find primer binding sites.
    a. genomes are blast-formatted datasets.
    b. primers are given as queries to BLAST.

* Store the binding sites in a relational (SQL) database.

The next step is done with a very simple and efficient SQL query:

* Find potential products as pairs of primer binding sites that are:
    a. Oriented toward each other.
    b. Less than some maximum distance apart.

At this point the only binding sites we care about are the ones that are associated with potential products.

* For each primer binding site associated with a potential product, estimate its priming efficiency, which depends on:
    a. temperature
    b. primer concentration
    (plus maybe ionic strength and some other things)

* Simulate the production of each potential product as they compete for resources over multiple rounds of replication.

* Visualize the results as a gel.

The first step (BLAST) is the one that really requires running on a server. But we can have useful primer design exercises using only bacterial genomes, which are small enough that we should be able to do that step using substring search in Javascript. Then we could run the whole thing in a standalone web page that could be hosted anywhere, or even downloaded to the user's laptop. Bacterial genomes are small enough to store as regular files on github, and we can provide a panel of them to choose from. This means that teachers won't have any server-related IT things to worry about.
