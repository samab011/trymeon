# Template photography

Six images generated for the mini-site heroes. They are **not committed** —
this build container cannot reach the CDN, so the files have to be fetched
once on a machine with normal network access:

```sh
bash assets/img/fetch.sh
```

`templates.css` already points at `../img/<name>.png` for each surface, with
the CDN copy as a second background layer and the CSS gradient as a third. A
background layer that fails to load simply is not painted, so the page degrades
on its own and never shows a broken image.

| File | Used by | Subject |
|---|---|---|
| `dine.png` | Saffron | Upscale restaurant interior at night, warm pendant lights |
| `arch.png` | UrbanNest | Contemporary villa at dusk, lit windows |
| `cloth.png` | ZAHRA | Ivory linen kurta on a form, cream studio backdrop |
| `hotel.png` | StayNest | Boutique hotel suite, morning light |
| `car.png` | DriveHub | Black luxury SUV, grey seamless studio |
| `athlete.png` | PEAK FITNESS | Athlete training in a dark gym, rim light |

Generated with Recraft V4.1 at 2K. Optimise before production — 2K PNGs are
large; convert to WebP and resize to about 1600px wide.
