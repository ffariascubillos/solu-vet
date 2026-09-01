Nueva skill para hacer commits.

Esta skill tiene el proposito de estandarizar los mensajes que se incluirán en cada commit de este repositorio.

Esta skill debe ser una skill exclusiva de este proyecto.

Cada vez que el usuario diga que debes hacer un commit, que solo diga "commit", que mencione "haz commit de mis cambios", "hacer commit", o cuando tu le ofrezcas al usuario a hacer un commit y la respuesta sea positiva es tu trabajo correr esta skill.

Pasos a seguir:

1. Estamos en la rama main o master?
Sí: Preguntarle al usuario si quiere hacer commit en la rama principal o si desea cambiarse de rama primero. Si el usuario desea cambiarse de rama entonces proponerle un nombre para la rama.
No: Siguiente paso.

2. El espacio de trabajo tiene cambios que no se encuentran en staging?
Sí: detenerse inmediatamente y decirle al usuario "Tienes cambios que no se encuentran en staging".
No: Avanzamos al paso siguiente.

3. El espacio de trabajo tiene cambios en el area de staging?
Sí: podemos continuar.
No: decirle al usuario que no se encuentran cambios disponibles para hacer commit.

4. Si todo se encuentra ok, entonces procedemos a asignarle un mensaje al commit.
Mensaje: "[intención] {Mensaje breve del commit}"

La intención puede ser uno de los siguientes casos:
Feat
Bugfix
Refactor
Test
Doc
Design

El mensaje debe ser algo muy breve de que fue lo que se hizo.

La descripción del commit debe decir exclusivamente lo siguiente:

Listado de las cosas que cambiaron.
Razones por las que estas cosas cambiaron.
