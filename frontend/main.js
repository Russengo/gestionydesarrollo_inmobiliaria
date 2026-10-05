document.addEventListener('DOMContentLoaded', function() {

```
const navbar = document.getElementById('mainNav');

if (navbar) {

    window.addEventListener('scroll', function() {

        if (window.scrollY > 50) {

            navbar.style.backgroundColor = 'rgba(23, 23, 40, 1)';
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';

        } else {

            navbar.style.backgroundColor = 'rgba(23, 23, 40, 0.85)';
            navbar.style.boxShadow = 'none';

        }

    });

}


const navLinks = document.querySelectorAll(
    '.navbar-nav .nav-link'
);

const menuToggle = document.getElementById('navbarNav');

if (menuToggle) {

    const bsCollapse = new bootstrap.Collapse(
        menuToggle,
        {
            toggle: false
        }
    );

    navLinks.forEach(function(link) {

        link.addEventListener('click', function() {

            if (menuToggle.classList.contains('show')) {
                bsCollapse.toggle();
            }

        });

    });

}


document
    .querySelectorAll('a[href^="#"], a[href^="index.html#"]')
    .forEach(anchor => {

        anchor.addEventListener('click', function(e) {

            const targetId = this
                .getAttribute('href')
                .replace('index.html', '');

            if (targetId.startsWith('#')) {

                const target = document.querySelector(targetId);

                if (target) {

                    e.preventDefault();

                    target.scrollIntoView({
                        behavior: 'smooth'
                    });

                }

            }

        });

    });
```

});
