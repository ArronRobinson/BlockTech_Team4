// *******
// survey
// *******

document.addEventListener('DOMContentLoaded', function() {
   
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    const nextToStep2 = document.getElementById('next-to-step2');
    const backToStep1 = document.getElementById('back-to-step1');
    const nextToStep3 = document.getElementById('next-to-step3');
    const backToStep2 = document.getElementById('back-to-step2');
    
    const categoryItems = document.querySelectorAll('.category-item');
    const SubcategoryGroup = document.querySelectorAll('.checkbox-grid input[type="checkbox"]');
    const moodCheckboxes = document.querySelectorAll('.mood-options input[type="checkbox"]');


    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            categoryItems.forEach(otherItem => {
                if (otherItem !== this) {
                    otherItem.classList.remove('selected');
                    const checkbox = otherItem.querySelector('input[type="radio"]');
                    if (checkbox) checkbox.checked = false; 
                }
            });
    
            this.classList.add('selected');
            const checkbox = this.querySelector('input[type="radio"]');
            if (checkbox) checkbox.checked = true; 
        });
    });

    // clicked kleur verandere

    SubcategoryGroup.forEach(item => {
        item.addEventListener('click', function() {
            const label = this.parentElement;
            label.classList.toggle("selected", this.checked);
        });
    });

    moodCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", function () {
           const label = this.closest(".mood-option");
           label.classList.toggle("selected", this.checked);
        });
    });

    
    // Navigation: Step 1 to Step 2
    nextToStep2.addEventListener('click', function() {
        const selectedCategories = document.querySelectorAll('.category-item.selected');
        if (selectedCategories.length === 0) {
            alert('Selecteer ten minste één categorie');
            return;
        }
        
        selectedCategories.forEach(category => {
            const categoryName = category.getAttribute('data-category');
            const subcategory = document.querySelector(`.${categoryName}Opties`);
            if (subcategory) {
                subcategory.style.display = 'block';
            } else {
                console.warn(`Geen subcategorie gevonden voor: ${categoryName}`);
            }
        });

        step1.style.display = 'none';
        step2.style.display = 'block';
    });
    
    
    // Navigation: Step 2 to Step 1
    backToStep1.addEventListener('click', function() {
        location.reload();
    });


    // Navigation: Step 2 to Step 3
    nextToStep3.addEventListener('click', function(e) {
        e.preventDefault(); 

        const selectedInterests = document.querySelectorAll('input[name="interests"]:checked');
    
        step2.style.display = 'none';
        step3.style.display = 'block';
    });
 

    // Navigation: Step 3 to Step 2 
    backToStep2.addEventListener('click', function() {
  
        step3.style.display = 'none';
        step2.style.display = 'block';
    });


   // Form submission validation
    document.getElementById('surveyForm').addEventListener('submit', function(e) {
        const selectedMoods = document.querySelectorAll('input[name="mood"]:checked');
        
        if (selectedMoods.length === 0) {
            e.preventDefault();
            alert('Selecteer ten minste één sfeer voor je podcast');
        }
    });

});