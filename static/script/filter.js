document.addEventListener("DOMContentLoaded", function () {
    const options = {
        valueNames: ['title', { name: 'likes', attr: 'data-likes' }],
        listClass: 'list',
    };

    const podcastList = new List('podcast-list', options);

    // FILTER FUNCTION
    document.getElementById("filter").addEventListener("change", function () {
        let filterValue = this.value.toLowerCase();

        podcastList.filter(item => {
            const itemTags = item.elm.querySelector(".tags-container");
            if (!itemTags) return false; // Skip if no tags

            const tags = Array.from(itemTags.querySelectorAll(".tag")).map(tag => tag.textContent.toLowerCase());
            return filterValue === "all" || tags.includes(filterValue);
        });
    });

    // SORT FUNCTION
    document.getElementById("sort").addEventListener("change", function () {
        let [field, order] = this.value.split(":");
        order = order || "asc"; // Default to ascending
        podcastList.sort(field, { order });
    });
});
