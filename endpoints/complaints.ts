import { Router, Request, Response } from 'express';
import * as db from "../db";
const databaseName = "complaints";

const usersRouter = Router();

usersRouter.get("/complaints", (req: Request, res: Response) => {
    db.findAll(databaseName, "complaints")
        .then((data) => res.send(data))
        // .catch((err) => res.send({ error: err }));
        .catch((err) => {
            console.log('get complaints err is', err);
            // do not expose error on client
            res.send({ error: true })
        });
});

usersRouter.get("/complaints/search", (req: Request, res: Response) => {
    return db.searchInColumns(databaseName, "complaints", req.query.q as string, [
        'reporterName',
        'reporterEmail',
        'description',
    ])
        .then(data => res.send(data))
        .catch(err => {
            console.log('search complaints err is', err);
            // do not expose error on client
            res.send({ error: true });
        })
});

usersRouter.get("/complaints/:_id", (req: Request, res: Response) => {
    db.findById(databaseName, "complaints", parseInt(req.params._id))
        .then((data) => {
        if(data){
            res.send(data)
        }
        else{
            res.status(404).send();
        }
        })
        .catch((err) => {
            console.log('getById err is', err);
            // do not expose error on client
            res.send({ error: true })
        });
});

usersRouter.post("/complaints", (req: Request, res: Response) => {
    db.insert(databaseName, "complaints", req.body)
        .then((data) =>
            res.send({
                success: true,
                _id: data,
            })
        )
        .catch((err) => {
            console.log('insert err is', err);
            // do not expose error on client
            res.send({
                success: false,
            })
        });
});

usersRouter.put("/complaints", (req: Request, res: Response) => {
    db.update(databaseName, "complaints", req.body)
        .then((data) =>
            res.send({
                success: true,
                _id: data,
            })
        )
        .catch((err) => {
            console.log('update complaints err', err);
            // do not expose error on client
            res.send({
                success: false,
            });
        });
});

usersRouter.delete("/complaints/:id", (req: Request, res: Response) => {
    db.remove(databaseName, "complaints", parseInt(req.params.id))
        .then(() => {
            res.send({
                success: true,
            });
        })
        .catch((err) => {
            console.log('delete complaint error is', err);
            // do not expose error on client
            res.send({
                success: false,
            });
        });
});

export default usersRouter;
