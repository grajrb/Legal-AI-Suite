# RBAC Matrix (MVP)

| Resource / Action                  | Admin | Lawyer | Paralegal | Demo |
|------------------------------------|:-----:|:------:|:---------:|:----:|
| Firm settings                      |  ✔    |   ✖    |     ✖     |  ✖   |
| Invite users                       |  ✔    |   ✖    |     ✖     |  ✖   |
| View users                         |  ✔    |   ✔    |     ✖     |  ✖   |
| Create client                      |  ✔    |   ✖    |     ✖     |  ✖   |
| View clients                       |  ✔    |   ✔    |     ✔     |  ✖   |
| Create matter                      |  ✔    |   ✔    |     ✖     |  ✖   |
| View matters                       |  ✔    |   ✔    |     ✔     |  ✖   |
| Create folder                      |  ✔    |   ✔    |     ✔     |  ✖   |
| Upload documents                   |  ✔    |   ✔    |     ✔     |  ✔   |
| View documents                     |  ✔    |   ✔    |     ✔     |  ✔   |
| Delete documents                   |  ✔    |   ✖    |     ✖     |  ✖   |
| Run extraction/analysis            |  ✔    |   ✔    |     ✔     |  ✖   |
| Chat (matter)                      |  ✔    |   ✔    |     ✔     |  ✔   |
| View/Generate templates            |  ✔    |   ✔    |     ✖     |  ✖   |
| Use admin assistant (structured)   |  ✔    |   ✖    |     ✖     |  ✖   |
| View audit logs                    |  ✔    |   ✖    |     ✖     |  ✖   |
| Billing (subscription, payments)   |  ✔    |   ✖    |     ✖     |  ✖   |

Notes:
- All access is scoped to `firm_id`; lawyers typically see only assigned or created matters; paralegals see operational queues.
- Demo user is anonymous and limited to demo endpoints only.
