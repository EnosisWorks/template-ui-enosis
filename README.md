# EnosisWorks — szablon panelu administracyjnego

Gotowy wygląd panelu admina w barwach EnosisWorks: menu boczne, pasek górny,
pulpit, tabele, formularze, okna i ekran logowania. Czyste HTML, CSS i trochę
JavaScriptu — bez frameworka i bez instalowania czegokolwiek.

Służy jako wzór przy budowie naszych aplikacji: kopiujesz potrzebne kawałki
HTML i arkusze CSS do swojego projektu (także React, Vue itp.).

## Jak obejrzeć

Otwórz `index.html` w przeglądarce. Ekran logowania jest w `login.html`.

## Co gdzie jest

```
index.html    panel ze wszystkimi widokami
login.html    logowanie, kod jednorazowy, odzyskiwanie hasła
css/          tokeny marki, style panelu i logowania
js/           nawigacja, menu, okna, sortowanie i filtry tabel
assets/brand/ logo i elementy graficzne
fonts/        DM Sans
```

Kolory i kroje marki są w `css/enosisworks-tokens.css` — nie zmieniaj ich ręcznie,
tylko podmieniaj cały plik przy aktualizacji marki.
