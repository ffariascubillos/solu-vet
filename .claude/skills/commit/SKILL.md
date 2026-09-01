---
name: commit
description: Estandariza el proceso y el mensaje de los commits de este repositorio. Úsala cuando el usuario diga "commit", "haz commit", "haz commit de mis cambios", "hacer commit", o cuando tú le ofrezcas hacer un commit y el usuario responda afirmativamente.
---

# Commit

Estandariza los mensajes y el proceso de commit de este repositorio. Esta skill es exclusiva de este proyecto.

## Cuándo ejecutarla

- El usuario dice "commit", "haz commit", "haz commit de mis cambios", "hacer commit", o similar.
- Tú le ofreces al usuario hacer un commit y responde afirmativamente.

## Pasos

1. **¿Estamos en la rama `main` o `master`?**

   Verifica con `git branch --show-current`.
   - **Sí**: pregúntale al usuario si quiere hacer el commit directamente en la rama principal o si prefiere cambiarse de rama primero. Si elige cambiarse, propónle un nombre de rama (kebab-case, descriptivo del cambio) y créala solo si el usuario lo confirma.
   - **No**: continúa al paso 2.

2. **¿Hay cambios en el working tree que no están en el área de staging?**

   Revisa con `git status`.
   - **Sí**: detente inmediatamente y dile al usuario: "Tienes cambios que no se encuentran en staging". No hagas `git add` por tu cuenta ni continúes — espera instrucciones.
   - **No**: continúa al paso 3.

3. **¿Hay cambios en el área de staging?**

   - **No**: dile al usuario que no hay cambios disponibles para hacer commit. Detente.
   - **Sí**: continúa al paso 4.

4. **Construye el mensaje del commit.**

   Título:
   ```
   [Intención] Mensaje breve del commit
   ```

   La intención es una de: `Feat`, `Bugfix`, `Refactor`, `Test`, `Doc`, `Design`.
   El mensaje breve describe en pocas palabras qué se hizo.

   El cuerpo del commit debe contener **exclusivamente**:
   - Listado de las cosas que cambiaron.
   - Razones por las que estas cosas cambiaron.

   No agregues secciones, checklists, ni relleno adicional al cuerpo.

   Ejemplo:
   ```
   [Feat] Configurar EXPO_PUBLIC_API_URL en mobile

   - Reemplazada la IP hardcodeada en apps/mobile/src/services/api.ts por EXPO_PUBLIC_API_URL.
   - Agregado apps/mobile/.env.example como plantilla del formato esperado.

   La IP hardcodeada impedía correr la app en otra red o dispositivo sin editar código fuente.
   ```

   Además del contenido anterior (que es exclusivo del cuerpo del mensaje), sigue aplicando las reglas generales del harness para crear commits: crear un commit nuevo en vez de amend, no usar `--no-verify` ni `--no-gpg-sign` salvo pedido explícito, y agregar como trailer final `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

5. Muéstrale el mensaje propuesto al usuario, ejecuta `git commit -m "..."` y confirma el resultado con `git status`.
