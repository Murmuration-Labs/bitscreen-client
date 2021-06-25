import { Router, Request, Response } from 'express';
import * as db from "../db";
import * as emailTemplates from "../email-templates";
const databaseName = "complaints";

const sgMail = require('@sendgrid/mail')
//we should put this on a env file
sgMail.setApiKey('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');

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
    const emailRegexValidator = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(!emailRegexValidator.test(String(req.body.reporterEmail).toLowerCase())){
        res.status(400).send({ err: 'Invalid email'});
        return;
    }

    db.insert(databaseName, "complaints", req.body)
        .then((data) => {
            sendEmail(req.body.reporterEmail);
            res.send({
                success: true,
                _id: data,
            })
            }
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

// we should move this to a service file
const sendEmail = (receiver) => {

    const msg = {
        to: receiver,
        from: 'office@keyko.io',
        subject: emailTemplates.CreateComplaint.subject,
        html: emailTemplates.CreateComplaint.body,
    }

    sgMail
    .send(msg)
    .then(() => {
        console.log('Email sent')
    })
    .catch((error) => {
        console.error(error)
    })
}

export default usersRouter;
